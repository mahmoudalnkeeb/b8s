import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { authConfig } from '../../infrastructure/configs';
import { DIContainer } from '../../infrastructure/di/container';
import { logger } from '../../infrastructure/utils/logger';

export interface AuthRequest extends Request {
  user?: {
    userId: string;
    email: string;
    role?: string;
    authType: 'jwt' | 'api-key';
  };
}

export const authMiddleware = {
  authenticate: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      // Check for Bearer token
      const authHeader = req.headers.authorization;

      // Check for API key
      const apiKey = req.headers['x-api-key'] as string | undefined;

      if (authHeader?.startsWith('Bearer ')) {
        // JWT authentication
        const token = authHeader.split(' ')[1];
        if (!token) {
          return res.status(401).json({ error: 'Invalid token format' });
        }
        const secret = authConfig.jwt.secret as string;
        const decoded = jwt.verify(token, secret) as unknown as {
          userId: string;
          email: string;
        };

        req.user = {
          userId: decoded.userId,
          email: decoded.email,
          authType: 'jwt',
        };
        return next();
      } else if (apiKey) {
        // API key authentication
        const validatedKey = await DIContainer.validateApiKey.execute(apiKey);

        if (!validatedKey) {
          return res.status(401).json({ error: 'Invalid API key' });
        }

        // Get user from key
        const user = await DIContainer.userRepo.findById(validatedKey.userId);
        if (!user) {
          return res.status(401).json({ error: 'User not found' });
        }

        const reqUser: AuthRequest['user'] = {
          userId: user.userId,
          email: user.email,
          authType: 'api-key',
        };
        if (user.role) {
          reqUser.role = user.role;
        }
        req.user = reqUser;

        // Update last used
        await DIContainer.apiKeyRepo.updateLastUsed(validatedKey.keyId);

        return next();
      }

      return res.status(401).json({ error: 'Unauthorized' });
    } catch (error) {
      logger.error('Auth middleware error', {
        error: error instanceof Error ? error.message : String(error),
      });

      // Differentiate between auth errors and system errors
      if (error instanceof jwt.JsonWebTokenError) {
        return res.status(401).json({ error: 'Invalid or expired token' });
      }
      if (error instanceof jwt.TokenExpiredError) {
        return res.status(401).json({ error: 'Token has expired' });
      }

      // For other errors, return a generic message but log the details
      return res.status(401).json({ error: 'Authentication failed' });
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
