import { Request, Response, NextFunction } from 'express';
import { logger } from '../../infrastructure/utils/logger';
import { ZodError } from 'zod';
import { DomainError } from '../../domain/errors';
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

export class ErrorMiddleware {
  public static handleError(
    err: any,
    req: Request,
    res: Response,
    _next: NextFunction,
  ) {
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
      const statusCode =
        err.name === 'NotFoundError'
          ? 404
          : err.name === 'UnauthorizedError'
            ? 401
            : err.name === 'InsufficientBalanceError'
              ? 402
              : 400;

      logger.warn(`Domain Error: ${err.message}`, { name: err.name, code: err.code, ...context });
      return res.status(statusCode).json({
        status: 'error',
        message: err.message,
        code: err.code,
      });
    }

    if (err instanceof AppError) {
      errorMonitor.captureException(err, context);
      return res.status(err.statusCode).json({
        status: 'error',
        message: err.message,
      });
    }

    // Unexpected errors
    errorMonitor.captureException(err, context);
    return res.status(500).json({
      status: 'error',
      message: err.message || 'Internal server error',
    });
  }
}
