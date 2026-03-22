import { Router } from 'express';
import { ToolController } from './controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
const controller = new ToolController();

router.use(authMiddleware.authenticate);

router.post('/', controller.create);
router.get('/', controller.listMyTools);
router.get('/:toolId', controller.getById);
router.patch('/:toolId', controller.update);
router.delete('/:toolId', controller.delete);

export default router;
