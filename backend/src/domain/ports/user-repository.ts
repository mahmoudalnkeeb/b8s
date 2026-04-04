import { IUser } from '../models';

export interface IUserRepository {
  findById(userId: string): Promise<IUser | null>;
  findByEmail(email: string): Promise<IUser | null>;
  create(user: IUser): Promise<IUser>;
  update(userId: string, updates: Partial<IUser>): Promise<IUser | null>;
}
