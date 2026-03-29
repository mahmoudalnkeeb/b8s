import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authConfig } from '../../infrastructure/configs';
import { DIContainer } from '../../infrastructure/di/container';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
  };
}

export const authMiddleware = {
  authenticate: (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];

    try {
      const secret = authConfig.jwt.secret as string;
      const decoded = jwt.verify(token as string, secret as string) as unknown as {
        userId: string;
        email: string;
      };
      req.user = decoded;
      return next();
    } catch {
      return res.status(401).json({ error: 'Invalid token' });
    }
  },

  authorizeAdmin: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const user = await DIContainer.userRepo.findById(userId);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Forbidden: Admin access required' });
      }

      return next();
    } catch (error) {
      return next(error);
    }
  },

  authorizeAgent: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const agentId = req.params['agentId'];

      if (!agentId) {
        return res.status(400).json({ error: 'Agent ID is required' });
      }

      const agent = await DIContainer.agentRepo.findById(agentId as string);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      if (agent.ownerId !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      return next();
    } catch (error) {
      return next(error);
    }
  },

  authorizeAgentOrPublic: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const agentId = req.params['agentId'];

      if (!agentId) {
        return res.status(400).json({ error: 'Agent ID is required' });
      }

      const agent = await DIContainer.agentRepo.findById(agentId as string);
      if (!agent) {
        return res.status(404).json({ error: 'Agent not found' });
      }

      // Allow access if user owns the agent OR agent is public
      if (agent.ownerId !== userId && agent.accessRules.type !== 'public') {
        return res.status(403).json({ error: 'Forbidden' });
      }

      return next();
    } catch (error) {
      return next(error);
    }
  },

  authorizeConversation: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const conversationId = req.params['conversationId'];

      if (!conversationId) {
        return res.status(400).json({ error: 'Conversation ID is required' });
      }

      const conversation = await DIContainer.convoRepo.findById(conversationId as string);
      if (!conversation) {
        return res.status(404).json({ error: 'Conversation not found' });
      }

      if (conversation.userId !== userId) {
        return res.status(403).json({ error: 'Forbidden' });
      }

      return next();
    } catch (error) {
      return next(error);
    }
  },
};
