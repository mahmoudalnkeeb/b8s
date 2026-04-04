export interface IPasswordResetToken {
  token: string;
  userId: string;
  expiresAt: Date;
  used: boolean;
  createdAt: Date;
}

export interface IPasswordResetRepository {
  create(token: IPasswordResetToken): Promise<void>;
  findByToken(token: string): Promise<IPasswordResetToken | null>;
  markAsUsed(token: string): Promise<void>;
  deleteByUserId(userId: string): Promise<void>;
}