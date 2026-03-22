import { ICouponRepository } from '../../domain/ports/billing-repository';

export class AdminDeactivateCouponUseCase {
  constructor(private couponRepo: ICouponRepository) {}

  async execute(code: string) {
    await this.couponRepo.deactivate(code);
    return { message: `Coupon ${code} deactivated` };
  }
}
