import { IBillingRepository, ICouponRepository } from '../../domain/ports/billing-repository';
import { NotFoundError, DomainError } from '../../domain/errors';

export interface RedeemCouponRequest {
  userId: string;
  code: string;
}

export class RedeemCouponUseCase {
  constructor(
    private billingRepo: IBillingRepository,
    private couponRepo: ICouponRepository,
  ) {}

  async execute(request: RedeemCouponRequest) {
    const coupon = await this.couponRepo.findByCode(request.code);
    if (!coupon) {
      throw new NotFoundError('Coupon not found', 'COUPON_NOT_FOUND');
    }

    if (!coupon.active) {
      throw new DomainError('This coupon has been deactivated', 'COUPON_INACTIVE');
    }

    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      throw new DomainError('This coupon has expired', 'COUPON_EXPIRED');
    }

    if (coupon.usedCount >= coupon.maxUses) {
      throw new DomainError('This coupon has reached its usage limit', 'COUPON_MAX_USES');
    }

    if (coupon.usedBy.includes(request.userId)) {
      throw new DomainError('You have already redeemed this coupon', 'COUPON_ALREADY_USED');
    }

    // Find or create billing account
    let account = await this.billingRepo.findByUserId(request.userId);
    if (!account) {
      account = await this.billingRepo.create({
        userId: request.userId,
        tier: coupon.tier as any,
        cuBalance: 0,
        grantedCuBalance: coupon.cuGrant,
        totalCuUsed: 0,
        billingCycleStart: new Date(),
      } as any);
    } else {
      await this.billingRepo.updateBalance(request.userId, {
        tier: coupon.tier as any,
        grantedCuBalance: account.grantedCuBalance + coupon.cuGrant,
      } as any);
    }

    // Track coupon usage
    await this.couponRepo.incrementUsage(request.code, request.userId);

    return {
      tier: coupon.tier,
      cuGranted: coupon.cuGrant,
      message: `Coupon redeemed! You received ${coupon.cuGrant} CU.`,
    };
  }
}
