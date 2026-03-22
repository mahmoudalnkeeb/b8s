import { QdrantClient } from '@qdrant/js-client-rest';
import { env } from '../loaders/env';

export interface IVectorDbClient {
  connect(): Promise<void>;
  getClient(): unknown;
}

export class QdrantVectorClient implements IVectorDbClient {
  private client: QdrantClient;

  constructor() {
    const url = env.VECTOR_DB_URL;

    if (!url) {
      throw new Error('VECTOR_DB_URL is not defined');
    }

    this.client = new QdrantClient({
      url,
    });
  }

  async connect(): Promise<void> {
    try {
      // Simple health check
      await this.client.getCollections();
      console.log('Successfully connected to Qdrant');
    } catch (error) {
      console.error('Failed to connect to Qdrant:', error);
      throw error;
    }
  }

  getClient(): QdrantClient {
    return this.client;
  }
}

export class VectorDbFactory {
  static create(): IVectorDbClient {
    const type = env.VECTOR_DB_TYPE || 'qdrant';

    if (type === 'qdrant') {
      return new QdrantVectorClient();
    }

    throw new Error(`Unsupported vector DB type: ${type}`);
  }
}
