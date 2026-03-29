import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';

const rateLimiter = new RateLimiterMemory({
  points: 100, // 100 requests
  duration: 60, // per 60 seconds by IP
});

export const rateLimiterMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const ip = req.ip || req.socket.remoteAddress || '127.0.0.1';
  rateLimiter
    .consume(ip)
    .then((rateLimiterRes) => {
      res.setHeader('Retry-After', rateLimiterRes.msBeforeNext / 1000);
      res.setHeader('X-RateLimit-Limit', 100);
      res.setHeader('X-RateLimit-Remaining', rateLimiterRes.remainingPoints);
      res.setHeader(
        'X-RateLimit-Reset',
        new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString(),
      );
      next();
    })
    .catch((rateLimiterRes) => {
      if (rateLimiterRes.msBeforeNext) {
        res.setHeader('Retry-After', rateLimiterRes.msBeforeNext / 1000);
        res.setHeader('X-RateLimit-Limit', 100);
        res.setHeader('X-RateLimit-Remaining', rateLimiterRes.remainingPoints);
        res.setHeader(
          'X-RateLimit-Reset',
          new Date(Date.now() + rateLimiterRes.msBeforeNext).toISOString(),
        );
      }
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'You have exceeded the rate limit. Please try again later.',
      });
    });
};
