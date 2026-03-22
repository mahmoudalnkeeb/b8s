import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { redeemCouponDto } from './dto';
import { DIContainer } from '../../infrastructure/di/container';

export class BillingController {
  public getBalance = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const userId = req.user!.userId;
      const balance = await DIContainer.getBalance.execute(userId);
      return res.status(200).json(balance);
    } catch (error) {
      return next(error);
    }
  };

  public redeemCoupon = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const userId = req.user!.userId;
      const dto = redeemCouponDto.parse(req.body);
      const result = await DIContainer.redeemCoupon.execute({ userId, code: dto.code });
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };
}
