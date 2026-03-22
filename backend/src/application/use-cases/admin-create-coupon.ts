import { ICouponRepository } from '../../domain/ports/billing-repository';
import { randomBytes } from 'crypto';

export interface AdminCreateCouponRequest {
  code?: string | undefined;
  tier: string;
  cuGrant: number;
  maxUses: number;
  expiresAt?: string | undefined;
}

export class AdminCreateCouponUseCase {
  constructor(private couponRepo: ICouponRepository) {}

  async execute(request: AdminCreateCouponRequest) {
    const code = request.code?.toUpperCase() || randomBytes(4).toString('hex').toUpperCase();

    const coupon = await this.couponRepo.create({
      code,
      tier: request.tier as any,
      cuGrant: request.cuGrant,
      maxUses: request.maxUses,
      usedCount: 0,
      usedBy: [],
      expiresAt: request.expiresAt ? new Date(request.expiresAt) : undefined,
      active: true,
    } as any);

    return coupon;
  }
}
