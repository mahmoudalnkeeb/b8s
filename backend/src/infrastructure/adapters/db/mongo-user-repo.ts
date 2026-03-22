import { IUserRepository } from '../../../domain/ports/user-repository';
import { IUser } from '../../../domain/models';
import { DatabaseError } from '../../../domain/errors';
import { UserModel, IUser as IUserDoc } from '../../db/models';

export class MongoUserRepository implements IUserRepository {
  private mapToDomain(doc: IUserDoc): IUser {
    const obj = doc.toObject() as IUserDoc & { createdAt: Date; updatedAt: Date };
    const user: IUser = {
      userId: obj.userId,
      email: obj.email,
      name: obj.name,
      role: obj.role,
      passwordHash: obj.passwordHash,
    };

    if (obj.createdAt) {
      user.createdAt = obj.createdAt;
    }
    if (obj.updatedAt) {
      user.updatedAt = obj.updatedAt;
    }

    return user;
  }

  async findById(userId: string): Promise<IUser | null> {
    try {
      const doc = await UserModel.findOne({ userId });
      return doc ? this.mapToDomain(doc) : null;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_FIND_USER_ERROR');
    }
  }

  async findByEmail(email: string): Promise<IUser | null> {
    try {
      const doc = await UserModel.findOne({ email });
      return doc ? this.mapToDomain(doc) : null;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_FIND_USER_BY_EMAIL_ERROR');
    }
  }

  async create(user: IUser): Promise<IUser> {
    try {
      const doc = await UserModel.create(user as unknown as any);
      return this.mapToDomain(doc);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_SAVE_USER_ERROR');
    }
  }
}
