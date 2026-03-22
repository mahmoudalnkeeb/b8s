import { IAgentRepository } from '../../domain/ports';
import { NotFoundError } from '../../domain/errors';
import { UserPinModel } from '../../infrastructure/db/models'; // Temporary mix until UserPinRepo is created

export class ToggleAgentPinUseCase {
  constructor(private agentRepo: IAgentRepository) {}

  async execute(agentId: string, userId: string) {
    const agent = await this.agentRepo.findById(agentId);
    if (!agent) throw new NotFoundError('Agent not found', 'AGENT_NOT_FOUND');

    const existing = await UserPinModel.findOne({ userId, agentId });

    if (existing) {
      await UserPinModel.deleteOne({ _id: existing._id });
      return { isPinned: false };
    } else {
      await UserPinModel.create({ userId, agentId });
      return { isPinned: true };
    }
  }
}
