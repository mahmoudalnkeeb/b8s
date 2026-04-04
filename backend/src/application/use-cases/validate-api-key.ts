import { createHash } from 'crypto';
import { IApiKeyRepository } from '../../domain/ports';

export class ValidateApiKeyUseCase {
  constructor(private apiKeyRepo: IApiKeyRepository) {}

  async execute(plainKey: string): Promise<{ keyId: string; userId: string } | null> {
    // Hash the provided key
    const keyHash = createHash('sha256').update(plainKey).digest('hex');

    // Find by hash
    const apiKey = await this.apiKeyRepo.findByKeyHash(keyHash);

    if (!apiKey) {
      return null;
    }

    return {
      keyId: apiKey.keyId,
      userId: apiKey.userId,
    };
  }
}
