import { IMessage, IToolDefinition, IToolCall } from '../models';

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
}

export interface ILLMProvider {
  generateText(
    messages: IMessage[],
    tools?: IToolDefinition[],
    systemInstruction?: string,
  ): Promise<{
    content: string;
    toolCalls?: IToolCall[];
    thoughtSignature?: string;
    usage?: TokenUsage;
  }>;
  streamText(
    messages: IMessage[],
    tools?: IToolDefinition[],
    systemInstruction?: string,
  ): AsyncGenerator<
    { content: string; toolCalls?: IToolCall[]; thoughtSignature?: string; usage?: TokenUsage },
    void,
    unknown
  >;
  bindTools(tools: IToolDefinition[]): void;
}
