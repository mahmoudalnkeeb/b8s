import { logger } from '../utils/logger';

/**
 * Abstract Error Monitor to centralize error reporting (e.g., Sentry, LogRocket, etc.)
 */
export class ErrorMonitor {
  private static instance: ErrorMonitor;

  private constructor() {
    // Future initialization (e.g., Sentry.init)
  }

  public static getInstance(): ErrorMonitor {
    if (!ErrorMonitor.instance) {
      ErrorMonitor.instance = new ErrorMonitor();
    }
    return ErrorMonitor.instance;
  }

  /**
   * Captures an exception and sends it to the monitoring platform.
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

    // FUTURE: Integrate with Sentry or other platforms here
    // Sentry.captureException(error, { extra: context });
  }

  /**
   * Logs a message with a specific severity.
   */
  public captureMessage(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
    context: Record<string, unknown> = {},
  ): void {
    logger.log(level, `Monitor message: ${message}`, context);

    // FUTURE: Sentry.captureMessage(message, level);
  }
}

export const errorMonitor = ErrorMonitor.getInstance();
