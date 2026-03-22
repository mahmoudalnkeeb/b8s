import { IToolCall } from './tool';

export enum MessageRole {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system',
  TOOL = 'tool',
}

export interface IMessage {
  role: MessageRole;
  content: string;
  timestamp: Date;
  metadata?: Record<string, unknown> | undefined;
  toolCalls?: IToolCall[] | undefined;
}

export interface IConversation {
  conversationId: string;
  agentId: string;
  userId: string;
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}
