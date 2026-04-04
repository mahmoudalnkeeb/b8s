import { Router } from 'express';
import { AuthController } from './controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
const controller = new AuthController();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/me', authMiddleware.authenticate, controller.getMe);

// Password management (public)
router.post('/forgot-password', controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);

// Password management (authenticated)
router.post('/change-password', authMiddleware.authenticate, controller.changePassword);

export default router;
