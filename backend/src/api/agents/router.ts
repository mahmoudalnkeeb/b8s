import { Router } from 'express';
import multer from 'multer';
import { AgentController } from './controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
const controller = new AgentController();
const upload = multer({ storage: multer.memoryStorage() });

// Discover is public (no auth required)
router.get('/discover', controller.listDiscover);

// All other routes require authentication
router.use(authMiddleware.authenticate);

router.post('/', controller.create);
router.get('/my', controller.listMyAgents);
router.get('/pinned', controller.listPinned);
router.get('/:agentId', controller.getById);
router.patch('/:agentId', authMiddleware.authorizeAgent, controller.update);
router.delete('/:agentId', authMiddleware.authorizeAgent, controller.delete);
router.post('/:agentId/deploy', authMiddleware.authorizeAgent, controller.deploy);
router.post('/:agentId/pin', controller.togglePin);
router.post(
  '/:agentId/kb',
  upload.single('file'),
  authMiddleware.authorizeAgent,
  controller.uploadKnowledgeBase,
);
router.get('/:agentId/kb', authMiddleware.authorizeAgent, controller.getKnowledgeBase);
router.delete(
  '/:agentId/kb/:docId',
  authMiddleware.authorizeAgent,
  controller.deleteKnowledgeBaseDoc,
);
router.get('/:agentId/jobs/:jobId', authMiddleware.authorizeAgent, controller.getJobStatus);
router.get('/:agentId/memories', authMiddleware.authorizeAgent, controller.listMemories);

export default router;
