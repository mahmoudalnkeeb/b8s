import jwt from 'jsonwebtoken';
import { ITokenService } from '../../../domain/ports/token-service';
import { authConfig } from '../../configs';

export class JwtTokenService implements ITokenService {
  generate(payload: Record<string, unknown>, expiresIn?: string): string {
    const secret = authConfig.jwt.secret as string;
    const expiry = expiresIn || (authConfig.jwt.expiresIn as string);
    return jwt.sign(payload, secret, {
      expiresIn: expiry as any,
    });
  }

  verify(token: string): Record<string, unknown> {
    const secret = authConfig.jwt.secret as string;
    return jwt.verify(token, secret) as Record<string, unknown>;
  }
}
