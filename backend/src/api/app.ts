import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import routes from '@/api/router';
import { logger } from '../infrastructure/utils/logger';
import { ErrorMiddleware } from './middlewares/error';
import { rateLimiterMiddleware } from './middlewares/rate-limiter';

export const app = express();

app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

// Apply rate limiter globally
app.use(rateLimiterMiddleware);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', routes);

// Global Error Handler (Must be after routes)
app.use(ErrorMiddleware.handleError);
