import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth';
import { DIContainer } from '../../infrastructure/di/container';
import { AuthRequest } from '../middlewares/auth';
import { Response, NextFunction } from 'express';

const router = Router();

const controller = {
  listApiKeys: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const keys = await DIContainer.listApiKeys.execute(userId);
      return res.status(200).json(keys);
    } catch (error) {
      return next(error);
    }
  },

  createApiKey: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const { name } = req.body;

      if (!name || typeof name !== 'string' || name.trim().length < 1) {
        return res.status(400).json({ error: 'Name is required' });
      }

      const result = await DIContainer.createApiKey.execute({
        userId,
        name: name.trim(),
      });

      return res.status(201).json(result);
    } catch (error) {
      return next(error);
    }
  },

  revokeApiKey: async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
      const userId = req.user!.userId;
      const keyId = req.params['keyId'] as string;

      if (!keyId) {
        return res.status(400).json({ error: 'Key ID is required' });
      }

      await DIContainer.revokeApiKey.execute(keyId, userId);
      return res.status(204).send();
    } catch (error) {
      return next(error);
    }
  },
};

router.use(authMiddleware.authenticate);
router.get('/', controller.listApiKeys);
router.post('/', controller.createApiKey);
router.delete('/:keyId', controller.revokeApiKey);

export default router;
