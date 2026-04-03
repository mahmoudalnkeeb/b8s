import { IAgentRepository, type PaginationParams } from '../../../domain/ports/agent-repository';
import { IAgent, AccessType, MemoryReadAccess, MemoryWriteAccess } from '../../../domain/models';
import { DatabaseError } from '../../../domain/errors';
import { AgentModel, IAgent as IAgentDoc } from '../../db/models';

export class MongoAgentRepository implements IAgentRepository {
  private mapToDomain(doc: IAgentDoc): IAgent {
    const obj = doc.toObject() as any;

    // Support both old 'id' and new 'agentId' fields for backward compatibility
    const agentId = obj.agentId || obj.id;

    const agent: IAgent = {
      agentId: agentId,
      ownerId: obj.ownerId,
      name: obj.name,
      description: obj.description || '',
      config: {
        instructions: obj.config?.instructions || '',
        tools: obj.config?.tools || [],
        memoryEnabled: obj.config?.memoryEnabled ?? true,
        memoryReadAccess:
          (obj.config?.memoryReadAccess as unknown as MemoryReadAccess) || MemoryReadAccess.PRIVATE,
        memoryWriteAccess:
          (obj.config?.memoryWriteAccess as unknown as MemoryWriteAccess) ||
          MemoryWriteAccess.PRIVATE,
        ragEnabled: obj.config?.ragEnabled ?? true,
      },
      accessRules: {
        type: (obj.accessRules?.type as unknown as AccessType) || AccessType.PRIVATE,
      },
    };

    if (obj.accessRules?.allowList) {
      agent.accessRules.allowList = obj.accessRules.allowList;
    }
    if (obj.deployed !== undefined) {
      agent.deployed = obj.deployed;
    }
    if (obj.createdAt) {
      agent.createdAt = obj.createdAt;
    }
    if (obj.updatedAt) {
      agent.updatedAt = obj.updatedAt;
    }

    return agent;
  }

  async findById(agentId: string): Promise<IAgent | null> {
    try {
      // Search by agentId first, then by _id if needed (for very old data)
      let doc = await AgentModel.findOne({ agentId });
      if (!doc && agentId.match(/^[0-9a-fA-F]{24}$/)) {
        doc = await AgentModel.findById(agentId);
      }

      if (!doc) return null;
      return this.mapToDomain(doc);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_FIND_AGENT_ERROR');
    }
  }

  async findByOwnerId(ownerId: string): Promise<IAgent[]> {
    try {
      const docs = await AgentModel.find({ ownerId }).sort({ createdAt: -1 });
      return docs.map((doc) => this.mapToDomain(doc));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_FIND_USER_AGENTS_ERROR');
    }
  }

  async findByOwnerIdWithPagination(ownerId: string, params: PaginationParams): Promise<IAgent[]> {
    try {
      const query: Record<string, unknown> = { ownerId };
      
      if (params.search) {
        const escaped = params.search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        query['$or'] = [
          { name: { $regex: escaped, $options: 'i' } },
          { description: { $regex: escaped, $options: 'i' } },
        ];
      }

      const docs = await AgentModel.find(query)
        .sort({ updatedAt: -1 })
        .skip(params.offset)
        .limit(params.limit);
      return docs.map((doc) => this.mapToDomain(doc));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_FIND_USER_AGENTS_PAGINATION_ERROR');
    }
  }

  async countByOwnerId(ownerId: string, search: string): Promise<number> {
    try {
      const query: Record<string, unknown> = { ownerId };
      
      if (search) {
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        query['$or'] = [
          { name: { $regex: escaped, $options: 'i' } },
          { description: { $regex: escaped, $options: 'i' } },
        ];
      }

      return await AgentModel.countDocuments(query);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_COUNT_USER_AGENTS_ERROR');
    }
  }

  async findDiscover(search?: string): Promise<IAgent[]> {
    try {
      const query: Record<string, unknown> = {
        'accessRules.type': AccessType.PUBLIC,
        deployed: true,
      };

      if (search) {
        const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        query['$or'] = [
          { name: { $regex: escaped, $options: 'i' } },
          { description: { $regex: escaped, $options: 'i' } },
          { tags: { $in: [new RegExp(escaped, 'i')] } },
        ];
      }

      const docs = await AgentModel.find(query).sort({ createdAt: -1 });
      return docs.map((doc) => this.mapToDomain(doc));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_FIND_DISCOVER_AGENTS_ERROR');
    }
  }

  async create(agent: IAgent): Promise<void> {
    try {
      await AgentModel.create({ ...agent, agentId: agent.agentId } as unknown as any);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_SAVE_AGENT_ERROR');
    }
  }

  async update(agentId: string, updates: Partial<IAgent>): Promise<IAgent | null> {
    try {
      const mongoUpdates: Record<string, unknown> = { ...updates };
      const doc = await AgentModel.findOneAndUpdate(
        { agentId },
        { $set: mongoUpdates },
        {
          returnDocument: 'after',
        },
      );
      if (!doc) return null;
      return this.mapToDomain(doc);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_UPDATE_AGENT_ERROR');
    }
  }

  async delete(agentId: string, ownerId: string): Promise<boolean> {
    try {
      const result = await AgentModel.deleteOne({ agentId, ownerId });
      return result.deletedCount > 0;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_DELETE_AGENT_ERROR');
    }
  }
}
