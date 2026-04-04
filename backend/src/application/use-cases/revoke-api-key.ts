import { IApiKeyRepository } from '../../domain/ports';
import { NotFoundError } from '../../domain/errors';

export class RevokeApiKeyUseCase {
  constructor(private apiKeyRepo: IApiKeyRepository) {}

  async execute(keyId: string, userId: string): Promise<void> {
    const revoked = await this.apiKeyRepo.revoke(keyId, userId);

    if (!revoked) {
      throw new NotFoundError('API key not found', 'API_KEY_NOT_FOUND');
    }
  }
}
