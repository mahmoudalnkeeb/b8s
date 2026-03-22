import { Router } from 'express';
import { AdminController } from './controller';
import { authMiddleware } from '../middlewares/auth';

const adminRouter = Router();
const controller = new AdminController();

// All admin routes require authentication + admin role
adminRouter.use(authMiddleware.authenticate);
adminRouter.use(authMiddleware.authorizeAdmin);

// User management
adminRouter.get('/users', controller.listUsers);
adminRouter.post('/users/:userId/add-cus', controller.addCUs);

// Coupon management
adminRouter.get('/coupons', controller.listCoupons);
adminRouter.post('/coupons', controller.createCoupon);
adminRouter.patch('/coupons/:code/deactivate', controller.deactivateCoupon);

export default adminRouter;
