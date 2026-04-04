export interface IApiKey {
  keyId: string;
  userId: string;
  name: string;
  keyHash: string;
  keyPrefix: string;
  permissions: string[];
  createdAt: Date;
  lastUsedAt?: Date;
  revokedAt?: Date;
}

export interface IApiKeyRepository {
  create(apiKey: IApiKey): Promise<void>;
  findById(keyId: string): Promise<IApiKey | null>;
  findByUserId(userId: string): Promise<IApiKey[]>;
  findByKeyHash(keyHash: string): Promise<IApiKey | null>;
  revoke(keyId: string, userId: string): Promise<boolean>;
  updateLastUsed(keyId: string): Promise<void>;
}