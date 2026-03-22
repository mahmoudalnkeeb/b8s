import { IConversation } from '../models';

export interface IConversationRepository {
  findById(conversationId: string): Promise<IConversation | null>;
  findByUserId(userId: string): Promise<IConversation[]>;
  create(conversation: IConversation): Promise<void>;
  update(conversationId: string, updates: Partial<IConversation>): Promise<IConversation | null>;
  delete(conversationId: string, userId: string): Promise<boolean>;
}
