import { Router } from 'express';
import { BillingController } from './controller';
import { authMiddleware } from '../middlewares/auth';

const billingRouter = Router();
const controller = new BillingController();

billingRouter.use(authMiddleware.authenticate);

billingRouter.get('/balance', controller.getBalance);
billingRouter.post('/redeem-coupon', controller.redeemCoupon);

export default billingRouter;
