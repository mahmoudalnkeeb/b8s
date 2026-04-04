import { Request, Response, NextFunction } from 'express';
import { logger } from '../../infrastructure/utils/logger';
import { ZodError } from 'zod';
import {
  DomainError,
  NotFoundError,
  UnauthorizedError,
  InsufficientBalanceError,
  ConflictError,
  ValidationError,
  QuotaExceededError,
} from '../../domain/errors';
import { errorMonitor } from '../../infrastructure/external-services/error-monitor';

export class AppError extends Error {
  constructor(
    public override message: string,
    public statusCode: number = 500,
    public isOperational: boolean = true,
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

function getStatusCodeForError(err: DomainError): number {
  if (err instanceof NotFoundError) return 404;
  if (err instanceof UnauthorizedError) return 401;
  if (err instanceof InsufficientBalanceError) return 402;
  if (err instanceof ConflictError) return 409;
  if (err instanceof ValidationError) return 400;
  if (err instanceof QuotaExceededError) return 429;
  return 400;
}

export class ErrorMiddleware {
  public static handleError(err: unknown, req: Request, res: Response, _next: NextFunction) {
    const context = {
      path: req.path,
      method: req.method,
      query: req.query,
      body: req.body,
    };

    if (err instanceof ZodError) {
      const errors = err.flatten().fieldErrors;
      logger.warn('Validation Error', { errors, ...context });
      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors,
      });
    }

    if (err instanceof DomainError) {
      const statusCode = getStatusCodeForError(err);

      logger.warn(`Domain Error: ${err.message}`, { name: err.name, code: err.code, ...context });
      return res.status(statusCode).json({
        status: 'error',
        message: err.message,
        code: err.code,
      });
    }

    if (err instanceof AppError) {
      if (err.statusCode >= 500) {
        errorMonitor.captureException(err, context);
      }
      return res.status(err.statusCode).json({
        status: 'error',
        message: err.message,
      });
    }

    // Unexpected errors
    const isProduction = process.env['NODE_ENV'] === 'production';
    const errorMessage = err instanceof Error ? err.message : 'Internal server error';
    errorMonitor.captureException(err instanceof Error ? err : new Error(String(err)), context);
    return res.status(500).json({
      status: 'error',
      message: isProduction ? 'Internal server error' : errorMessage,
    });
  }
}
