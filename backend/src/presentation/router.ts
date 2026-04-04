import { Router } from 'express';
import authRouter from './auth/router';
import agentRouter from './agents/router';
import conversationRouter from './conversations/router';
import toolsRouter from './tools/router';
import billingRouter from './billing/router';
import adminRouter from './admin/router';
import feedbackRouter from './feedback/router';
import apiKeysRouter from './api-keys/router';

const router = Router();

router.use('/auth', authRouter);
router.use('/agents', agentRouter);
router.use('/conversations', conversationRouter);
router.use('/tools', toolsRouter);
router.use('/billing', billingRouter);
router.use('/admin', adminRouter);
router.use('/feedback', feedbackRouter);
router.use('/api-keys', apiKeysRouter);

export default router;
