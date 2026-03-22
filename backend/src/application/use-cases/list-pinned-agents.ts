import { IAgentRepository } from '../../domain/ports';
import { UserPinModel } from '../../infrastructure/db/models';

export class ListPinnedAgentsUseCase {
  constructor(private agentRepo: IAgentRepository) {}

  async execute(userId: string) {
    const pins = await UserPinModel.find({ userId });
    const agentIds = pins.map((p) => p.agentId);

    // Using findById in a loop or adding findByIds to repo.
    // For now, simple implementation.
    const agents = [];
    for (const id of agentIds) {
      const agent = await this.agentRepo.findById(id);
      if (agent) agents.push(agent);
    }
    return agents;
  }
}
