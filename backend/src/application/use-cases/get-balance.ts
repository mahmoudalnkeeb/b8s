import { IBillingRepository } from '../../domain/ports/billing-repository';
import { IUserRepository } from '../../domain/ports/user-repository';

export class GetBalanceUseCase {
  constructor(
    private billingRepo: IBillingRepository,
    private userRepo: IUserRepository,
  ) {}

  async execute(userId: string) {
    const user = await this.userRepo.findById(userId);
    const account = await this.billingRepo.findByUserId(userId);

    if (!account) {
      return {
        role: user?.role || 'user',
        tier: 'none',
        cuBalance: 0,
        grantedCuBalance: 0,
        totalCuUsed: 0,
      };
    }
    return {
      role: user?.role || 'user',
      tier: account.tier,
      cuBalance: account.cuBalance,
      grantedCuBalance: account.grantedCuBalance,
      totalCuUsed: account.totalCuUsed,
    };
  }
}
