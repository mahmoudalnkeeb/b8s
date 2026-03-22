import { IAgentRepository } from '../../domain/ports';
import { NotFoundError, UnauthorizedError } from '../../domain/errors';

export class DeleteAgentUseCase {
  constructor(private agentRepo: IAgentRepository) {}

  async execute(agentId: string, userId: string) {
    const agent = await this.agentRepo.findById(agentId);
    if (!agent) throw new NotFoundError('Agent not found', 'AGENT_NOT_FOUND');

    if (agent.ownerId !== userId) {
      throw new UnauthorizedError('Unauthorized to delete this agent', 'UNAUTHORIZED');
    }

    return await this.agentRepo.delete(agentId, userId);
  }
}
