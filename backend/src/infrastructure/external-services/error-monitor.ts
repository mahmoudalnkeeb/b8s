import * as Sentry from '@sentry/node';
import { logger } from '../utils/logger';

/**
 * Error Monitor to centralize error reporting via Sentry.
 */
export class ErrorMonitor {
  private static instance: ErrorMonitor;

  private constructor() {}

  public static getInstance(): ErrorMonitor {
    if (!ErrorMonitor.instance) {
      ErrorMonitor.instance = new ErrorMonitor();
    }
    return ErrorMonitor.instance;
  }

  /**
   * Captures an exception and sends it to Sentry.
   * @param error The error object to capture
   * @param context Additional metadata context
   */
  public captureException(error: Error, context: Record<string, unknown> = {}): void {
    // Internal logging
    logger.error('Error monitored:', {
      message: error.message,
      stack: error.stack,
      ...context,
    });

    Sentry.captureException(error, { extra: context });
  }

  /**
   * Logs a message with a specific severity and sends to Sentry.
   */
  public captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
    context: Record<string, unknown> = {},
  ): void {
    logger.log(level, `Monitor message: ${message}`, context);

    Sentry.captureMessage(message, {
      level: level === 'error' ? 'error' : level === 'warning' ? 'warning' : 'info',
      extra: context,
    });
  }
}

export const errorMonitor = ErrorMonitor.getInstance();
