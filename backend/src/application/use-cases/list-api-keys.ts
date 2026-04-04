import { IApiKeyRepository } from '../../domain/ports';

export class ListApiKeysUseCase {
  constructor(private apiKeyRepo: IApiKeyRepository) {}

  async execute(userId: string) {
    const apiKeys = await this.apiKeyRepo.findByUserId(userId);
    
    return apiKeys.map((key) => ({
      keyId: key.keyId,
      name: key.name,
      keyPrefix: key.keyPrefix,
      createdAt: key.createdAt,
      lastUsedAt: key.lastUsedAt,
    }));
  }
}