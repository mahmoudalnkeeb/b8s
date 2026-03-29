import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import routes from '@/presentation/router';
import { logger } from '../infrastructure/utils/logger';
import { ErrorMiddleware } from './middlewares/error';
import { rateLimiterMiddleware } from './middlewares/rate-limiter';

export const app = express();

app.use(cors());
app.use(express.json());

app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.url}`);
  next();
});

app.use(rateLimiterMiddleware);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api', routes);

app.use(ErrorMiddleware.handleError);
