import { IAgentRepository } from '../../domain/ports';
import { IAgent } from '../../domain/models';
import { NotFoundError } from '../../domain/errors';

export class GetAgentByIdUseCase {
  constructor(private agentRepo: IAgentRepository) {}

  async execute(agentId: string, userId: string): Promise<IAgent & { isPinned?: boolean }> {
    const agent = await this.agentRepo.findById(agentId);
    if (!agent) throw new NotFoundError('Agent not found', 'AGENT_NOT_FOUND');

    // Ownership and access rules could be checked here in the domain layer
    const isOwner = agent.ownerId === userId;

    const result: IAgent = { ...agent };
    if (!isOwner && agent.accessRules.type === 'public') {
      // Create a new config object without instructions if not owner
      result.config = {
        ...agent.config,
        instructions: '*** REDACTED ***',
      };
    }

    return result;
  }
}
