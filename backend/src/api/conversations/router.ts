import { Router } from 'express';
import { ConversationController } from './controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
const controller = new ConversationController();

// All conversation routes require authentication
router.use(authMiddleware.authenticate);

router.post('/', controller.create);
router.get('/my', controller.listMyConversations);
router.get('/:conversationId', authMiddleware.authorizeConversation, controller.getById);
router.post(
  '/:conversationId/messages',
  authMiddleware.authorizeConversation,
  controller.sendMessage,
);
router.delete('/:conversationId', authMiddleware.authorizeConversation, controller.delete);

export default router;
