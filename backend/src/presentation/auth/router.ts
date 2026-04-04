import { NextFunction, Request, Response, Router } from 'express';
import { AuthController } from './controller';
import { authMiddleware } from '../middlewares/auth';

const router = Router();
const controller = new AuthController();

// Stricter rate limit for password reset (3 requests per hour per IP)
const forgotPasswordLimiter = async (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  const key = `forgot-password:${ip}`;

  // Simple in-memory rate limiting
  const now = Date.now();
  const windowMs = 60 * 60 * 1000; // 1 hour
  const maxRequests = 3;

  const attempts = (global as any).forgotPasswordAttempts || {};
  const userAttempts = attempts[key] || [];

  // Clean old attempts
  attempts[key] = userAttempts.filter((t: number) => now - t < windowMs);

  if (attempts[key].length >= maxRequests) {
    return res.status(429).json({
      error: 'Too Many Requests',
      message: 'Too many password reset attempts. Please try again later.',
    });
  }

  attempts[key].push(now);
  (global as any).forgotPasswordAttempts = attempts;
  next();
  return;
};

router.post('/register', controller.register);
router.post('/login', controller.login);
router.get('/me', authMiddleware.authenticate, controller.getMe);

// Password management (public) - with stricter rate limiting
router.post('/forgot-password', forgotPasswordLimiter, controller.forgotPassword);
router.post('/reset-password', controller.resetPassword);

// Password management (authenticated)
router.post('/change-password', authMiddleware.authenticate, controller.changePassword);

export default router;
