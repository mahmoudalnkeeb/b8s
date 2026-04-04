import * as Sentry from '@sentry/node';
import { env } from './infrastructure/loaders/env';

if (env.SENTRY_DSN) {
  Sentry.init({
    dsn: env.SENTRY_DSN,
    sendDefaultPii: true,
    environment: process.env['NODE_ENV'] || 'development',
    tracesSampleRate: process.env['NODE_ENV'] === 'production' ? 0.1 : 1.0,
    beforeSend(event, hint) {
      const error = hint.originalException;

      if (error && typeof error === 'object') {
        const anyError = error as any;
        const status = anyError.statusCode || anyError.status;

        if (status && status < 500) {
          return null;
        }

        if (error instanceof Error) {
          if (error.constructor.name === 'ZodError' || error.name === 'ZodError') {
            return null;
          }

          if (error.constructor.name === 'DomainError' || error.name === 'DomainError') {
            return null;
          }

          const domainErrorTypes = [
            'NotFoundError',
            'UnauthorizedError',
            'ConflictError',
            'ValidationError',
            'BadRequestError',
            'InsufficientBalanceError',
            'QuotaExceededError',
            'LLMProviderError',
            'DatabaseError',
            'ToolExecutionError',
          ];

          if (
            domainErrorTypes.includes(error.constructor.name) ||
            domainErrorTypes.includes(error.name)
          ) {
            return null;
          }
        }
      }

      if (event.level && !['error', 'fatal'].includes(event.level)) {
        return null;
      }

      return event;
    },
  });
}
