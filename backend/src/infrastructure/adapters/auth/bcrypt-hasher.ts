import bcrypt from 'bcryptjs';
import { IPasswordHasher } from '../../../domain/ports/password-hasher';
import { authConfig } from '../../configs';

export class BcryptPasswordHasher implements IPasswordHasher {
  async hash(password: string): Promise<string> {
    return await bcrypt.hash(password, authConfig.bcrypt.saltRounds);
  }

  async compare(password: string, hash: string): Promise<boolean> {
    return await bcrypt.compare(password, hash);
  }
}
