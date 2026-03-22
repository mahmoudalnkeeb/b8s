import { IAgentRepository } from '../../domain/ports';

export class GetDiscoverAgentsUseCase {
  constructor(private agentRepo: IAgentRepository) {}

  async execute(search?: string) {
    return await this.agentRepo.findDiscover(search);
  }
}
