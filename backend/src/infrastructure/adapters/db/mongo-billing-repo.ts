import { IBillingRepository, ICouponRepository } from '../../../domain/ports/billing-repository';
import {
  IBillingAccount,
  ICoupon,
  IUsageLog,
  BillingAccountModel,
  CouponModel,
  UsageLogModel,
  UserModel,
} from '../../db/models';
import { DatabaseError } from '../../../domain/errors';

export class MongoBillingRepository implements IBillingRepository {
  async findByUserId(userId: string): Promise<IBillingAccount | null> {
    try {
      return await BillingAccountModel.findOne({ userId });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_FIND_BILLING_ERROR');
    }
  }

  async create(account: Partial<IBillingAccount>): Promise<IBillingAccount> {
    try {
      return await BillingAccountModel.create(account);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_CREATE_BILLING_ERROR');
    }
  }

  async updateBalance(
    userId: string,
    updates: Partial<IBillingAccount>,
  ): Promise<IBillingAccount | null> {
    try {
      return await BillingAccountModel.findOneAndUpdate(
        { userId },
        { $set: updates },
        { new: true },
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_UPDATE_BILLING_ERROR');
    }
  }

  async deductBalanceAtomic(
    userId: string,
    grantedDeduction: number,
    paidDeduction: number,
    cuCost: number,
  ): Promise<IBillingAccount | null> {
    try {
      // Atomically deduct using $inc with a guard condition
      return await BillingAccountModel.findOneAndUpdate(
        {
          userId,
          $expr: {
            $gte: [{ $add: ['$grantedCuBalance', '$cuBalance'] }, cuCost],
          },
        },
        {
          $inc: {
            grantedCuBalance: -grantedDeduction,
            cuBalance: -paidDeduction,
            totalCuUsed: cuCost,
          },
        },
        { new: true },
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_DEDUCT_BALANCE_ERROR');
    }
  }

  async logUsage(log: Partial<IUsageLog>): Promise<void> {
    try {
      await UsageLogModel.create(log);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_LOG_USAGE_ERROR');
    }
  }

  async listAllWithUsers(): Promise<
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
  > {
    try {
      const users = await UserModel.find({}, 'userId email name role').lean();
      const billings = await BillingAccountModel.find({}).lean();
      const billingMap = new Map(billings.map((b) => [b.userId, b]));

      return users.map((u) => {
        const b = billingMap.get(u.userId);
        return {
          userId: u.userId,
          email: u.email,
          name: u.name,
          role: u.role || 'user',
          tier: b?.tier || 'none',
          cuBalance: b?.cuBalance || 0,
          grantedCuBalance: b?.grantedCuBalance || 0,
          totalCuUsed: b?.totalCuUsed || 0,
        };
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_LIST_USERS_BILLING_ERROR');
    }
  }
}

export class MongoCouponRepository implements ICouponRepository {
  async findByCode(code: string): Promise<ICoupon | null> {
    try {
      return await CouponModel.findOne({ code: code.toUpperCase() });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_FIND_COUPON_ERROR');
    }
  }

  async create(coupon: Partial<ICoupon>): Promise<ICoupon> {
    try {
      return await CouponModel.create(coupon);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_CREATE_COUPON_ERROR');
    }
  }

  async incrementUsage(code: string, userId: string): Promise<void> {
    try {
      await CouponModel.findOneAndUpdate(
        { code: code.toUpperCase() },
        { $inc: { usedCount: 1 }, $push: { usedBy: userId } },
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_INCREMENT_COUPON_ERROR');
    }
  }

  async list(filter?: { active?: boolean }): Promise<ICoupon[]> {
    try {
      const query: Record<string, unknown> = {};
      if (filter?.active !== undefined) query['active'] = filter.active;
      return await CouponModel.find(query).sort({ createdAt: -1 });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_LIST_COUPONS_ERROR');
    }
  }

  async deactivate(code: string): Promise<void> {
    try {
      await CouponModel.findOneAndUpdate({ code: code.toUpperCase() }, { $set: { active: false } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_DEACTIVATE_COUPON_ERROR');
    }
  }
}
