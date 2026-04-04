import { IUserRepository, IPasswordHasher } from '../../domain/ports';
import { UnauthorizedError, BadRequestError } from '../../domain/errors';

export interface ChangePasswordRequest {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

export class ChangePasswordUseCase {
  constructor(
    private userRepo: IUserRepository,
    private passwordHasher: IPasswordHasher,
  ) {}

  async execute(request: ChangePasswordRequest): Promise<void> {
    // Find the user
    const user = await this.userRepo.findById(request.userId);
    if (!user) {
      throw new UnauthorizedError('User not found', 'USER_NOT_FOUND');
    }

    // Verify current password
    const isValid = await this.passwordHasher.compare(request.currentPassword, user.passwordHash);
    if (!isValid) {
      throw new UnauthorizedError('Current password is incorrect', 'INVALID_PASSWORD');
    }

    // Verify new password is different from current
    const isSamePassword = await this.passwordHasher.compare(
      request.newPassword,
      user.passwordHash,
    );
    if (isSamePassword) {
      throw new BadRequestError(
        'New password must be different from current password',
        'SAME_PASSWORD',
      );
    }

    // Hash new password and update
    const passwordHash = await this.passwordHasher.hash(request.newPassword);
    await this.userRepo.update(request.userId, { passwordHash });
  }
}
