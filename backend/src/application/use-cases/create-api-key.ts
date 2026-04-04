import { randomBytes } from 'crypto';
import { IApiKeyRepository, IPasswordHasher } from '../../domain/ports';

export interface CreateApiKeyRequest {
  userId: string;
  name: string;
}

export interface CreateApiKeyResult {
  keyId: string;
  key: string; // Plain text - only shown once
  name: string;
  keyPrefix: string;
  createdAt: Date;
}

export class CreateApiKeyUseCase {
  constructor(
    private apiKeyRepo: IApiKeyRepository,
    private passwordHasher: IPasswordHasher,
  ) {}

  async execute(request: CreateApiKeyRequest): Promise<CreateApiKeyResult> {
    // Generate API key in format: b8s_<random>
    const randomPart = randomBytes(16).toString('hex');
    const plainKey = `b8s_${randomPart}`;
    const keyHash = await this.passwordHasher.hash(plainKey);
    const keyPrefix = plainKey.slice(-6);
    const keyId = randomBytes(8).toString('hex');
    const createdAt = new Date();

    await this.apiKeyRepo.create({
      keyId,
      userId: request.userId,
      name: request.name,
      keyHash,
      keyPrefix,
      permissions: [],
      createdAt,
    });

    return {
      keyId,
      key: plainKey,
      name: request.name,
      keyPrefix,
      createdAt,
    };
  }
}