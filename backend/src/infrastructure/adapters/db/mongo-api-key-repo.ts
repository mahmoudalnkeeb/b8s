import { IApiKeyRepository, IApiKey } from '../../../domain/ports/api-key-repository';
import { ApiKeyModel, IApiKey as IApiKeyDoc } from '../../db/models';
import { DatabaseError } from '../../../domain/errors';

export class MongoApiKeyRepository implements IApiKeyRepository {
  private mapToDomain(doc: IApiKeyDoc): IApiKey {
    const apiKey: IApiKey = {
      keyId: doc.keyId,
      userId: doc.userId,
      name: doc.name,
      keyHash: doc.keyHash,
      keyPrefix: doc.keyPrefix,
      permissions: doc.permissions || [],
      createdAt: doc.createdAt,
    };
    if (doc.lastUsedAt) {
      apiKey.lastUsedAt = doc.lastUsedAt;
    }
    if (doc.revokedAt) {
      apiKey.revokedAt = doc.revokedAt;
    }
    return apiKey;
  }

  async create(apiKey: IApiKey): Promise<void> {
    try {
      await ApiKeyModel.create(apiKey);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_CREATE_API_KEY_ERROR');
    }
  }

  async findById(keyId: string): Promise<IApiKey | null> {
    try {
      const doc = await ApiKeyModel.findOne({ keyId, revokedAt: null });
      if (!doc) return null;
      return this.mapToDomain(doc);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_FIND_API_KEY_ERROR');
    }
  }

  async findByUserId(userId: string): Promise<IApiKey[]> {
    try {
      const docs = await ApiKeyModel.find({ userId, revokedAt: null }).sort({ createdAt: -1 });
      return docs.map((doc) => this.mapToDomain(doc));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_FIND_USER_API_KEYS_ERROR');
    }
  }

  async findByKeyHash(keyHash: string): Promise<IApiKey | null> {
    try {
      const doc = await ApiKeyModel.findOne({ keyHash, revokedAt: null });
      if (!doc) return null;
      return this.mapToDomain(doc);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_FIND_API_KEY_BY_HASH_ERROR');
    }
  }

  async revoke(keyId: string, userId: string): Promise<boolean> {
    try {
      const result = await ApiKeyModel.updateOne(
        { keyId, userId, revokedAt: null },
        { $set: { revokedAt: new Date() } }
      );
      return result.modifiedCount > 0;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_REVOKE_API_KEY_ERROR');
    }
  }

  async updateLastUsed(keyId: string): Promise<void> {
    try {
      await ApiKeyModel.updateOne({ keyId, revokedAt: null }, { $set: { lastUsedAt: new Date() } });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_UPDATE_API_KEY_LAST_USED_ERROR');
    }
  }
}