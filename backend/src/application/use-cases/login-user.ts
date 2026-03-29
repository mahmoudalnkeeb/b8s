import { IUserRepository, IPasswordHasher, ITokenService } from '../../domain/ports';
import { UnauthorizedError } from '../../domain/errors';

export interface LoginRequest {
  email: string;
  password: string;
}

export class LoginUserUseCase {
  constructor(
    private userRepo: IUserRepository,
    private passwordHasher: IPasswordHasher,
    private tokenService: ITokenService,
  ) {}

  async execute(request: LoginRequest) {
    const user = await this.userRepo.findByEmail(request.email);
    if (!user) {
      throw new UnauthorizedError('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const isPasswordValid = await this.passwordHasher.compare(request.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid credentials', 'INVALID_CREDENTIALS');
    }

    const token = this.tokenService.generate({ userId: user.userId, email: user.email });

    return { token, userId: user.userId, email: user.email };
  }
}
