import { IAgentRepository } from '../../domain/ports';
import { IAgent } from '../../domain/models';

export interface ListUserAgentsParams {
  userId: string;
  limit?: number;
  offset?: number;
  search?: string;
}

export interface ListUserAgentsResult {
  agents: IAgent[];
  total: number;
  limit: number;
  offset: number;
}

export class ListUserAgentsUseCase {
  constructor(private agentRepo: IAgentRepository) {}

  async execute(params: ListUserAgentsParams): Promise<ListUserAgentsResult> {
    const { userId, limit = 20, offset = 0, search = '' } = params;

    const [agents, total] = await Promise.all([
      this.agentRepo.findByOwnerIdWithPagination(userId, { limit, offset, search }),
      this.agentRepo.countByOwnerId(userId, search),
    ]);

    return { agents, total, limit, offset };
  }
}
