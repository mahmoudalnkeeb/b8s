import { IToolCall } from '../models';

export interface ToolExecutionContext {
  agentId: string;
  userId: string;
  conversationId: string;
  lastUserMessage?: string;
}

export interface IToolExecutor {
  execute(toolCall: IToolCall, context: ToolExecutionContext): Promise<unknown>;
}
