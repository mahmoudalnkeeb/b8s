import { ILLMProvider, IToolExecutor, ToolExecutionContext } from '../../domain/ports';
import { IMessage, IToolDefinition, MessageRole, IToolCall } from '../../domain/models';
import { LLMProviderError } from '../../domain/errors';
import { logger } from '@/infrastructure/utils/logger';

export interface OrchestratorResult {
  content: string;
  newMessages: IMessage[];
  usage?: { promptTokens: number; completionTokens: number };
}

export class AgentOrchestratorService {
  constructor(
    private llmProvider: ILLMProvider,
    private toolExecutor: IToolExecutor,
  ) {}

  async run(
    messages: IMessage[],
    tools: IToolDefinition[],
    systemInstruction?: string,
    context?: ToolExecutionContext,
  ): Promise<OrchestratorResult> {
    this.llmProvider.bindTools(tools);

    const currentMessages = [...messages];
    const newMessages: IMessage[] = [];

    for (let i = 0; i < 5; i++) {
      const response = await this.llmProvider.generateText(
        currentMessages,
        tools,
        systemInstruction,
      );

      const hasContent = response.content && response.content.trim() !== '';
      const hasToolCalls = response.toolCalls && response.toolCalls.length > 0;

      // Skip empty assistant messages (no text, no tool calls)
      if (hasContent || hasToolCalls) {
        const assistantMsg: IMessage = {
          role: MessageRole.ASSISTANT,
          content: response.content || '',
          timestamp: new Date(),
          ...(hasToolCalls ? { toolCalls: response.toolCalls } : {}),
          metadata: response.thoughtSignature
            ? { thoughtSignature: response.thoughtSignature }
            : undefined,
        };
        currentMessages.push(assistantMsg);
        newMessages.push(assistantMsg);
      }

      if (hasToolCalls) {
        if (!context)
          throw new LLMProviderError('Tool execution context is missing', 'MISSING_CONTEXT');
        for (const toolCall of response.toolCalls!) {
          const result = await this.toolExecutor.execute(toolCall, context);
          const toolMsg: IMessage = {
            role: MessageRole.TOOL,
            content: JSON.stringify(result),
            timestamp: new Date(),
            metadata: {
              toolName: toolCall.name,
              toolCallId: toolCall.id,
              thoughtSignature: toolCall.thoughtSignature || response.thoughtSignature,
            },
          };
          currentMessages.push(toolMsg);
          newMessages.push(toolMsg);
        }
        continue;
      }

      return { content: response.content, newMessages, ...(response.usage ? { usage: response.usage } : {}) };
    }
    throw new LLMProviderError('Agent loop exceeded maximum iterations.', 'MAX_ITERATIONS_REACHED');
  }

  async *runStream(
    messages: IMessage[],
    tools: IToolDefinition[],
    systemInstruction?: string,
    context?: ToolExecutionContext,
  ): AsyncGenerator<{ content: string; newMessages?: IMessage[]; usage?: { promptTokens: number; completionTokens: number } }, void, unknown> {
    logger.info('Starting agent orchestration', {
      agentId: context?.agentId,
      conversationId: context?.conversationId,
      userId: context?.userId,
      tools: JSON.stringify(tools),
      systemInstruction,
    });
    this.llmProvider.bindTools(tools);

    const currentMessages = [...messages];

    try {
      for (let i = 0; i < 5; i++) {
        const stream = this.llmProvider.streamText(currentMessages, tools, systemInstruction);

        let stepContent = '';
        const stepToolCalls: IToolCall[] = [];
        let stepThoughtSignature: string | undefined;

        for await (const chunk of stream) {
          if (chunk.content) {
            stepContent += chunk.content;
          }
          if (chunk.toolCalls) {
            stepToolCalls.push(...chunk.toolCalls);
          }
          if (chunk.thoughtSignature) {
            stepThoughtSignature = chunk.thoughtSignature;
          }
          yield { content: chunk.content || '', ...(chunk.usage ? { usage: chunk.usage } : {}) };
        }

        const hasContent = stepContent && stepContent.trim() !== '';
        const hasToolCalls = stepToolCalls.length > 0;

        if (hasContent || hasToolCalls) {
          const assistantMsg: IMessage = {
            role: MessageRole.ASSISTANT,
            content: stepContent,
            timestamp: new Date(),
            ...(hasToolCalls ? { toolCalls: stepToolCalls } : {}),
            metadata: stepThoughtSignature ? { thoughtSignature: stepThoughtSignature } : undefined,
          };
          currentMessages.push(assistantMsg);

          if (hasToolCalls) {
            if (!context)
              throw new LLMProviderError('Tool execution context is missing', 'MISSING_CONTEXT');

            const stepToolResults: IMessage[] = [];
            for (const toolCall of stepToolCalls) {
              const result = await this.toolExecutor.execute(toolCall, context);
              const toolMsg: IMessage = {
                role: MessageRole.TOOL,
                content: JSON.stringify(result),
                timestamp: new Date(),
                metadata: {
                  toolName: toolCall.name,
                  toolCallId: toolCall.id,
                  thoughtSignature: stepThoughtSignature,
                },
              };
              currentMessages.push(toolMsg);
              stepToolResults.push(toolMsg);
            }

            // Yield assistant message and tool results for persistence
            yield { content: '', newMessages: [assistantMsg, ...stepToolResults] };
            continue;
          }

          // Final step, yield assistant message for persistence
          yield { content: '', newMessages: [assistantMsg] };
        }
        return;
      }
      throw new LLMProviderError(
        'Agent loop exceeded maximum iterations.',
        'MAX_ITERATIONS_REACHED',
      );
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      yield { content: `\n\n[Error: ${errorMessage}]` };
      throw error;
    }
  }
}
