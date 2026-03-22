import { IAgentRepository } from '../../domain/ports';
import { IBillingRepository } from '../../domain/ports/billing-repository';
import { IAgent } from '../../domain/models';
import { InsufficientBalanceError } from '../../domain/errors';

export class CreateAgentUseCase {
  constructor(
    private agentRepo: IAgentRepository,
    private billingRepo: IBillingRepository,
  ) {}

  async execute(agent: IAgent): Promise<void> {
    // Check billing: user must have an active plan (tier !== 'none')
    const billing = await this.billingRepo.findByUserId(agent.ownerId);
    if (!billing || billing.tier === 'none') {
      throw new InsufficientBalanceError(
        'You need an active plan to create agents. Redeem a coupon or upgrade your plan.',
      );
    }

    await this.agentRepo.create(agent);
  }
}
