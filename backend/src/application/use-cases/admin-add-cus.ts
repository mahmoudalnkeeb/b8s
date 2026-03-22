import { IBillingRepository } from '../../domain/ports/billing-repository';
import { NotFoundError } from '../../domain/errors';

export interface AdminAddCUsRequest {
  userId: string;
  amount: number;
  asGranted?: boolean;
}

export class AdminAddCUsUseCase {
  constructor(private billingRepo: IBillingRepository) {}

  async execute(request: AdminAddCUsRequest) {
    let account = await this.billingRepo.findByUserId(request.userId);
    if (!account) {
      // Create a billing account if none exists
      account = await this.billingRepo.create({
        userId: request.userId,
        tier: 'none' as any,
        cuBalance: request.asGranted ? 0 : request.amount,
        grantedCuBalance: request.asGranted ? request.amount : 0,
        totalCuUsed: 0,
        billingCycleStart: new Date(),
      } as any);
      return { cuBalance: account.cuBalance, grantedCuBalance: account.grantedCuBalance };
    }

    const updates = request.asGranted
      ? { grantedCuBalance: account.grantedCuBalance + request.amount }
      : { cuBalance: account.cuBalance + request.amount };

    const updated = await this.billingRepo.updateBalance(request.userId, updates as any);
    if (!updated) throw new NotFoundError('User billing account not found', 'BILLING_NOT_FOUND');

    return { cuBalance: updated.cuBalance, grantedCuBalance: updated.grantedCuBalance };
  }
}
