import { ICouponRepository } from '../../domain/ports/billing-repository';

export class AdminListCouponsUseCase {
  constructor(private couponRepo: ICouponRepository) {}

  async execute() {
    return this.couponRepo.list();
  }
}
