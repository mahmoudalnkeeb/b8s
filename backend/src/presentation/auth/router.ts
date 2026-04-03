import { Router } from 'express';
import { AuthController } from './controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
const controller = new AuthController();

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/me', authMiddleware.authenticate, controller.getMe);

export default router;
