import { IAgent } from '../models';

export interface PaginationParams {
  limit: number;
  offset: number;
  search: string;
}

export interface IAgentRepository {
  findById(agentId: string): Promise<IAgent | null>;
  findByOwnerId(ownerId: string): Promise<IAgent[]>;
  findByOwnerIdWithPagination(ownerId: string, params: PaginationParams): Promise<IAgent[]>;
  countByOwnerId(ownerId: string, search: string): Promise<number>;
  findDiscover(search?: string): Promise<IAgent[]>;
  create(agent: IAgent): Promise<void>;
  update(agentId: string, updates: Partial<IAgent>): Promise<IAgent | null>;
  delete(agentId: string, ownerId: string): Promise<boolean>;
}
