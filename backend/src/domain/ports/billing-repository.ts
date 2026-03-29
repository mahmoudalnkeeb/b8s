import { IBillingAccount, ICoupon, IUsageLog } from '../models';

export interface IBillingRepository {
  findByUserId(userId: string): Promise<IBillingAccount | null>;
  create(account: Partial<IBillingAccount>): Promise<IBillingAccount>;
  updateBalance(userId: string, updates: Partial<IBillingAccount>): Promise<IBillingAccount | null>;
  logUsage(log: Partial<IUsageLog>): Promise<void>;
  listAllWithUsers(): Promise<
    Array<{
      userId: string;
      email: string;
      name: string;
      role: string;
      tier: string;
      cuBalance: number;
      grantedCuBalance: number;
      totalCuUsed: number;
    }>
  >;
}

export interface ICouponRepository {
  findByCode(code: string): Promise<ICoupon | null>;
  create(coupon: Partial<ICoupon>): Promise<ICoupon>;
  incrementUsage(code: string, userId: string): Promise<void>;
  list(filter?: { active?: boolean }): Promise<ICoupon[]>;
  deactivate(code: string): Promise<void>;
}
