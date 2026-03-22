import { IAgent } from '../models';

export interface IAgentRepository {
  findById(agentId: string): Promise<IAgent | null>;
  findByOwnerId(ownerId: string): Promise<IAgent[]>;
  findDiscover(search?: string): Promise<IAgent[]>;
  create(agent: IAgent): Promise<void>;
  update(agentId: string, updates: Partial<IAgent>): Promise<IAgent | null>;
  delete(agentId: string, ownerId: string): Promise<boolean>;
}
