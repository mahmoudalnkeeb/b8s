import { Router } from 'express';
import { AgentController } from './controller';
import { authMiddleware } from '../middlewares/auth';
import multer from 'multer';

// Use memory storage for fast small file uploads instead of disk storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});

const router = Router();
const controller = new AgentController();

router.use(authMiddleware.authenticate);

router.post('/', controller.create);
router.get('/my', controller.listMyAgents);
router.get('/discover', controller.listDiscover);
router.get('/pinned', controller.listPinned);
router.get('/:agentId', authMiddleware.authorizeAgentOrPublic, controller.getById);
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
router.get('/:agentId/jobs/latest', authMiddleware.authorizeAgent, controller.getLatestJobStatus);
router.get('/:agentId/jobs/:jobId', authMiddleware.authorizeAgent, controller.getJobStatus);
router.get('/:agentId/memories', authMiddleware.authorizeAgent, controller.listMemories);

export default router;
