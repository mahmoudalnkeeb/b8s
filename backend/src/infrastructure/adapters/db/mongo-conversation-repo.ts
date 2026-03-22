import { IConversationRepository } from '../../../domain/ports/conversation-repository';
import { IConversation, MessageRole } from '../../../domain/models';
import { DatabaseError } from '../../../domain/errors';
import { ConversationModel, IConversation as IConversationDoc } from '../../db/models';

export class MongoConversationRepository implements IConversationRepository {
  private mapToDomain(doc: IConversationDoc): IConversation {
    const obj = doc.toObject() as IConversationDoc & { createdAt: Date; updatedAt: Date };
    return {
      conversationId: obj.conversationId,
      agentId: obj.agentId,
      userId: obj.userId,
      messages: obj.messages.map((m) => {
        const msg: any = {
          role: m.role as unknown as MessageRole,
          content: m.content,
          timestamp: m.timestamp,
        };
        if (m.metadata) {
          msg.metadata = m.metadata;
        }
        if (m.toolCalls && m.toolCalls.length > 0) {
          msg.toolCalls = m.toolCalls;
        }
        return msg;
      }),
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    };
  }

  async findById(conversationId: string): Promise<IConversation | null> {
    try {
      const doc = await ConversationModel.findOne({ conversationId });
      return doc ? this.mapToDomain(doc) : null;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_FIND_CONVO_ERROR');
    }
  }

  async findByUserId(userId: string): Promise<IConversation[]> {
    try {
      const docs = await ConversationModel.find({ userId }).sort({ updatedAt: -1 });
      return docs.map((doc) => this.mapToDomain(doc));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_FIND_USER_CONVOS_ERROR');
    }
  }

  async create(conversation: IConversation): Promise<void> {
    try {
      await ConversationModel.create(conversation as unknown as any);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_SAVE_CONVO_ERROR');
    }
  }

  async update(
    conversationId: string,
    updates: Partial<IConversation>,
  ): Promise<IConversation | null> {
    try {
      const mongoUpdates: Record<string, unknown> = { ...updates };
      if (updates.conversationId) mongoUpdates['conversationId'] = updates.conversationId;
      const doc = await ConversationModel.findOneAndUpdate({ conversationId }, mongoUpdates, {
        returnDocument: 'after',
      });
      return doc ? this.mapToDomain(doc) : null;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_UPDATE_CONVO_ERROR');
    }
  }

  async delete(conversationId: string, userId: string): Promise<boolean> {
    try {
      const result = await ConversationModel.deleteOne({ conversationId, userId });
      return result.deletedCount > 0;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_DELETE_CONVO_ERROR');
    }
  }
}
