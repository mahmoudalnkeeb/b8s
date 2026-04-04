import { randomBytes } from 'crypto';
import { IUserRepository, IEmailService, IPasswordResetRepository } from '../../domain/ports';
import { env } from '../../infrastructure/loaders/env';

export interface ForgotPasswordRequest {
  email: string;
}

export class ForgotPasswordUseCase {
  constructor(
    private userRepo: IUserRepository,
    private emailService: IEmailService,
    private passwordResetRepo: IPasswordResetRepository,
  ) {}

  async execute(request: ForgotPasswordRequest): Promise<void> {
    const user = await this.userRepo.findByEmail(request.email);

    // Always return success to prevent email enumeration
    // If user exists, send reset email; otherwise, silently fail

    if (user) {
      // Delete any existing reset tokens for this user
      await this.passwordResetRepo.deleteByUserId(user.userId);

      // Generate reset token
      const token = randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

      await this.passwordResetRepo.create({
        token,
        userId: user.userId,
        expiresAt,
        used: false,
        createdAt: new Date(),
      });

      // Send reset email
      const resetUrl = `${env.NODE_ENV === 'production' ? 'https://b8s.com' : 'http://localhost:3001'}/auth/reset-password/${token}`;

      const html = this.getPasswordResetEmailHtml(user.name, resetUrl);
      await this.emailService.sendEmail(user.email, 'Reset your B8s password', html);
    }
  }

  private getPasswordResetEmailHtml(name: string, resetUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Reset your password</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Courier New', monospace;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #111111; border: 1px solid #333333;">
          <!-- Header -->
          <tr>
            <td style="padding: 30px; text-align: center; border-bottom: 1px solid #333333;">
              <span style="font-size: 24px; font-weight: bold; color: #ffffff; letter-spacing: 4px;">B8s</span>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h1 style="margin: 0 0 20px 0; font-size: 18px; color: #ffffff; font-weight: normal; letter-spacing: 2px;">
                PASSWORD RESET REQUEST
              </h1>
              
              <p style="margin: 0 0 20px 0; font-size: 12px; color: #888888; line-height: 1.6;">
                Hello ${name},
              </p>
              
              <p style="margin: 0 0 30px 0; font-size: 12px; color: #888888; line-height: 1.6;">
                We received a request to reset your B8s password. Click the button below to create a new password. This link will expire in 1 hour.
              </p>
              
              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 20px 0;">
                    <a href="${resetUrl}" style="display: inline-block; padding: 14px 30px; background-color: #3d81cc; color: #ffffff; text-decoration: none; font-size: 11px; letter-spacing: 2px; border: none;">
                      RESET PASSWORD
                    </a>
                  </td>
                </tr>
              </table>
              
              <p style="margin: 30px 0 0 0; font-size: 11px; color: #666666; line-height: 1.6;">
                If you didn't request this, you can safely ignore this email. Your password will remain unchanged.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; border-top: 1px solid #333333; text-align: center;">
              <p style="margin: 0; font-size: 10px; color: #555555; letter-spacing: 1px;">
                B8s Agent Network &bull; Automated System
              </p>
              <p style="margin: 10px 0 0 0; font-size: 9px; color: #444444;">
                &copy; ${new Date().getFullYear()} B8s. All rights reserved.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `.trim();
  }
}
