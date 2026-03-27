import {
  IToolExecutor,
  ToolExecutionContext,
  IMemoryService,
  IRagService,
  IAgentRepository,
  IToolRepository,
} from '../../../domain/ports';
import { IToolCall, MemoryReadAccess, MemoryWriteAccess } from '../../../domain/models';
import { ToolExecutionError } from '../../../domain/errors';
import { logger } from '../../utils/logger';

export class ToolExecutionAdapter implements IToolExecutor {
  constructor(
    private memoryService: IMemoryService,
    private ragService: IRagService,
    private agentRepo: IAgentRepository,
    private toolRepo: IToolRepository,
  ) {}

  async execute(toolCall: IToolCall, context: ToolExecutionContext): Promise<unknown> {
    try {
      const { name, arguments: args } = toolCall;

      logger.info('[TOOL] Executing tool', {
        toolName: name,
        args: JSON.stringify(args),
        agentId: context.agentId,
      });

      logger.debug('complete tool call object', {
        toolCall: JSON.stringify(toolCall),
      });

      if (name === 'memory_get') {
        const agent = await this.agentRepo.findById(context.agentId);
        return await this.memoryService.get({
          agentId: context.agentId,
          query: args['query'] as string,
          currentUserId: context.userId,
          ownerId: agent?.ownerId || '',
          readAccess: agent?.config.memoryReadAccess || MemoryReadAccess.PRIVATE,
        });
      }

      if (name === 'memory_set') {
        const agent = await this.agentRepo.findById(context.agentId);
        return await this.memoryService.set({
          agentId: context.agentId,
          conversationId: context.conversationId,
          text: args['text'] as string,
          currentUserId: context.userId,
          ownerId: agent?.ownerId || '',
          writeAccess: agent?.config.memoryWriteAccess || MemoryWriteAccess.PRIVATE,
          metadata: { importance: (args['importance'] as number) || 1 },
        });
      }

      if (name === 'rag_query') {
        const rawQuery = args?.['query'];
        // Fallback: if LLM didn't provide query, use last user message
        const query = (rawQuery as string) || context.lastUserMessage || '';

        logger.info('[TOOL] RAG query args', {
          rawQuery,
          fallbackUsed: !rawQuery && !!context.lastUserMessage,
          finalQuery: query.substring(0, 100),
        });

        return await this.ragService.query({
          agentId: context.agentId,
          query,
        });
      }

      // Handle custom tools
      const userTools = await this.toolRepo.findByUserId(context.userId);
      const customTool = userTools.find((t) => t.name === name);

      if (customTool) {
        let url = customTool.url;
        const method = customTool.method;
        const headers = {
          'Content-Type': 'application/json',
          ...customTool.headers,
        };

        // Replace path parameters {param} in URL
        Object.entries(args).forEach(([key, value]) => {
          const placeholder = `{${key}}`;
          if (url.includes(placeholder)) {
            url = url.replace(placeholder, String(value));
          }
        });

        const fetchOptions: RequestInit = {
          method,
          headers,
        };

        if (method !== 'GET') {
          fetchOptions.body = JSON.stringify(args);
        } else {
          // For GET, append remaining args as query params if not used in path
          const queryParams = new URLSearchParams();
          Object.entries(args).forEach(([key, value]) => {
            if (!customTool.url.includes(`{${key}}`)) {
              queryParams.append(key, String(value));
            }
          });
          const qs = queryParams.toString();
          if (qs) {
            url += (url.includes('?') ? '&' : '?') + qs;
          }
        }

        const response = await fetch(url, fetchOptions);
        const result = await response.json();
        return result;
      }

      console.log(`Tool not found: ${name}`);
      return { success: false, error: `Tool ${name} not found` };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new ToolExecutionError(message, 'TOOL_EXECUTION_FAILED');
    }
  }
}
