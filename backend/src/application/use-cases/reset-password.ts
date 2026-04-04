import { IUserRepository, IPasswordHasher, IPasswordResetRepository } from '../../domain/ports';
import { BadRequestError } from '../../domain/errors';

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export class ResetPasswordUseCase {
  constructor(
    private userRepo: IUserRepository,
    private passwordHasher: IPasswordHasher,
    private passwordResetRepo: IPasswordResetRepository,
  ) {}

  async execute(request: ResetPasswordRequest): Promise<void> {
    // Find the token
    const resetToken = await this.passwordResetRepo.findByToken(request.token);
    
    if (!resetToken) {
      throw new BadRequestError('Invalid or expired reset token', 'INVALID_TOKEN');
    }
    
    // Check if token is expired
    if (resetToken.expiresAt < new Date()) {
      throw new BadRequestError('Reset token has expired', 'TOKEN_EXPIRED');
    }
    
    // Find the user
    const user = await this.userRepo.findById(resetToken.userId);
    if (!user) {
      throw new BadRequestError('User not found', 'USER_NOT_FOUND');
    }
    
    // Hash new password and update user
    const passwordHash = await this.passwordHasher.hash(request.newPassword);
    await this.userRepo.update(user.userId, { passwordHash });
    
    // Mark token as used
    await this.passwordResetRepo.markAsUsed(request.token);
    
    // Delete all reset tokens for this user
    await this.passwordResetRepo.deleteByUserId(user.userId);
  }
}