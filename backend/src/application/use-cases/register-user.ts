import { randomUUID } from 'crypto';
import { IUserRepository, IPasswordHasher, ITokenService } from '../../domain/ports';
import { IBillingRepository } from '../../domain/ports/billing-repository';
import { ConflictError } from '../../domain/errors';
import { BillingTier } from '../../domain/models';

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
}

export class RegisterUserUseCase {
  constructor(
    private userRepo: IUserRepository,
    private passwordHasher: IPasswordHasher,
    private tokenService: ITokenService,
    private billingRepo: IBillingRepository,
  ) {}

  async execute(request: RegisterRequest) {
    const existingUser = await this.userRepo.findByEmail(request.email);
    if (existingUser) {
      throw new ConflictError('Email already registered', 'EMAIL_EXISTS');
    }

    const passwordHash = await this.passwordHasher.hash(request.password);

    const userId = randomUUID();
    const user = await this.userRepo.create({
      userId,
      name: request.name,
      email: request.email,
      passwordHash,
    });

    // Create billing account with no tier and 0 CU (free tier requires coupon)
    await this.billingRepo.create({
      userId,
      tier: BillingTier.NONE,
      cuBalance: 0,
      grantedCuBalance: 0,
      totalCuUsed: 0,
      billingCycleStart: new Date(),
    });

    const token = this.tokenService.generate({ userId: user.userId, email: user.email });

    return { token, userId: user.userId, email: user.email };
  }
}
