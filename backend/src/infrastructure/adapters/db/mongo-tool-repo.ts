import { IToolRepository } from '../../../domain/ports/tool-repository';
import { ITool } from '../../../domain/models';
import { DatabaseError } from '../../../domain/errors';
import { ToolModel, ITool as IToolDoc } from '../../db/models';

export class MongoToolRepository implements IToolRepository {
  private mapToDomain(doc: IToolDoc): ITool {
    const obj = doc.toObject() as IToolDoc & { createdAt: Date; updatedAt: Date };
    const tool: ITool = {
      toolId: obj.toolId,
      userId: obj.userId,
      name: obj.name,
      description: obj.description,
      url: obj.url,
      method: obj.method,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
    };

    if (obj.headers) {
      tool.headers = Object.fromEntries(obj.headers);
    }
    if (obj.apiSchema) {
      tool.apiSchema = obj.apiSchema;
    }

    return tool;
  }

  async findById(toolId: string): Promise<ITool | null> {
    try {
      const doc = await ToolModel.findOne({ toolId });
      return doc ? this.mapToDomain(doc) : null;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_FIND_TOOL_ERROR');
    }
  }

  async findByUserId(userId: string): Promise<ITool[]> {
    try {
      const docs = await ToolModel.find({ userId }).sort({ createdAt: -1 });
      return docs.map((doc) => this.mapToDomain(doc));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_FIND_USER_TOOLS_ERROR');
    }
  }

  async create(tool: ITool): Promise<void> {
    try {
      await ToolModel.create(tool as unknown as any);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_SAVE_TOOL_ERROR');
    }
  }

  async update(toolId: string, updates: Partial<ITool>): Promise<ITool | null> {
    try {
      const doc = await ToolModel.findOneAndUpdate(
        { toolId },
        { $set: updates },
        { returnDocument: 'after' },
      );
      return doc ? this.mapToDomain(doc) : null;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_UPDATE_TOOL_ERROR');
    }
  }

  async delete(toolId: string, userId: string): Promise<boolean> {
    try {
      const result = await ToolModel.deleteOne({ toolId, userId });
      return result.deletedCount > 0;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_DELETE_TOOL_ERROR');
    }
  }
}
