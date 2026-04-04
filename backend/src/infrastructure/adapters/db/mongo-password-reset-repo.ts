import { IPasswordResetRepository, IPasswordResetToken } from '../../../domain/ports/password-reset-repository';
import { PasswordResetTokenModel } from '../../db/models';
import { DatabaseError } from '../../../domain/errors';

export class MongoPasswordResetRepository implements IPasswordResetRepository {
  async create(token: IPasswordResetToken): Promise<void> {
    try {
      await PasswordResetTokenModel.create(token);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_CREATE_PASSWORD_RESET_TOKEN_ERROR');
    }
  }

  async findByToken(token: string): Promise<IPasswordResetToken | null> {
    try {
      const doc = await PasswordResetTokenModel.findOne({ token, used: false });
      if (!doc) return null;
      return {
        token: doc.token,
        userId: doc.userId,
        expiresAt: doc.expiresAt,
        used: doc.used,
        createdAt: doc.createdAt,
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_FIND_PASSWORD_RESET_TOKEN_ERROR');
    }
  }

  async markAsUsed(token: string): Promise<void> {
    try {
      await PasswordResetTokenModel.updateOne({ token }, { $set: { used: true } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_MARK_PASSWORD_RESET_TOKEN_USED_ERROR');
    }
  }

  async deleteByUserId(userId: string): Promise<void> {
    try {
      await PasswordResetTokenModel.deleteMany({ userId });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_DELETE_PASSWORD_RESET_TOKEN_ERROR');
    }
  }
}