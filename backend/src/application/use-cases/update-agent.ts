import { IAgentRepository } from '../../domain/ports';
import { IAgent } from '../../domain/models';
import { NotFoundError, UnauthorizedError } from '../../domain/errors';

export class UpdateAgentUseCase {
  constructor(private agentRepo: IAgentRepository) {}

  async execute(agentId: string, updates: Partial<IAgent>, userId: string) {
    const agent = await this.agentRepo.findById(agentId);
    if (!agent) throw new NotFoundError('Agent not found', 'AGENT_NOT_FOUND');

    if (agent.ownerId !== userId) {
      throw new UnauthorizedError('Unauthorized to update this agent', 'UNAUTHORIZED');
    }

    return await this.agentRepo.update(agentId, updates);
  }
}
