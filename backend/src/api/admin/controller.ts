import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth';
import { addCUsDto, createCouponDto } from '../billing/dto';
import { DIContainer } from '../../infrastructure/di/container';

export class AdminController {
  public listUsers = async (
    _req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const users = await DIContainer.adminListUsers.execute();
      return res.status(200).json(users);
    } catch (error) {
      return next(error);
    }
  };

  public addCUs = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const userId = req.params['userId'] as string;
      const dto = addCUsDto.parse(req.body);
      const result = await DIContainer.adminAddCUs.execute({
        userId,
        amount: dto.amount,
        asGranted: dto.asGranted,
      });
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };

  public listCoupons = async (
    _req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const coupons = await DIContainer.adminListCoupons.execute();
      return res.status(200).json(coupons);
    } catch (error) {
      return next(error);
    }
  };

  public createCoupon = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const dto = createCouponDto.parse(req.body);
      const coupon = await DIContainer.adminCreateCoupon.execute({
        ...dto,
        code: dto.code ?? undefined,
        expiresAt: dto.expiresAt ?? undefined,
      });
      return res.status(201).json(coupon);
    } catch (error) {
      return next(error);
    }
  };

  public deactivateCoupon = async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<Response | void> => {
    try {
      const code = req.params['code'] as string;
      const result = await DIContainer.adminDeactivateCoupon.execute(code);
      return res.status(200).json(result);
    } catch (error) {
      return next(error);
    }
  };
}
