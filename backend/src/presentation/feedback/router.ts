import { Router } from 'express';
import { FeedbackController } from './controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
const controller = new FeedbackController();

router.use(authMiddleware.authenticate);

router.post('/', controller.submit);

export default router;
