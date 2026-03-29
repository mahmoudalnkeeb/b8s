import { logger } from '../utils/logger';
import type { ILogger } from '../../domain/services/logger';

export class LoggerAdapter implements ILogger {
  info(message: string, meta?: Record<string, unknown>): void {
    logger.info(message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    logger.warn(message, meta);
  }

  error(message: string, meta?: Record<string, unknown> | unknown): void {
    logger.error(message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    logger.debug(message, meta);
  }
}
