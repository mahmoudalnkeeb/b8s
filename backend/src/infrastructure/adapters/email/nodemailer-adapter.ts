import nodemailer from 'nodemailer';
import { IEmailService } from '../../../domain/ports/email-service';
import { env } from '../../loaders/env';
import { logger } from '../../utils/logger';

export class NodemailerAdapter implements IEmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: env.SMTP_USER && env.SMTP_PASS
        ? {
            user: env.SMTP_USER,
            pass: env.SMTP_PASS,
          }
        : undefined,
    });
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: env.SMTP_FROM,
        to,
        subject,
        html,
      });
      logger.info('Email sent successfully', { to, subject });
    } catch (error) {
      logger.error('Failed to send email', { to, subject, error });
      throw error;
    }
  }
}