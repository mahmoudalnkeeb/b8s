import { IAgentRepository } from '../../domain/ports';
import { IAgent } from '../../domain/models';

export class ListUserAgentsUseCase {
  constructor(private agentRepo: IAgentRepository) {}

  async execute(userId: string): Promise<IAgent[]> {
    return await this.agentRepo.findByOwnerId(userId);
  }
}
