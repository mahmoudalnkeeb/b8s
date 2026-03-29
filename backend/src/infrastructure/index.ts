import { MongoDbClient } from './db/mongo';
import { IVectorDbClient, VectorDbFactory } from './db/vector';
import { QdrantClient } from '@qdrant/js-client-rest';
import { Mongoose } from 'mongoose';
import { DIContainer } from './di/container';

export class CoreLoader {
  private static mongo: MongoDbClient;
  private static vector: IVectorDbClient;

  public static async init(): Promise<void> {
    this.mongo = MongoDbClient.getInstance();
    this.vector = VectorDbFactory.create();

    // 2. Connect MongoDB
    await this.mongo.connect();

    // 3. Connect Vector DB
    await this.vector.connect();

    // 4. Handle Graceful Shutdown
    this.setupGracefulShutdown();
  }

  private static setupGracefulShutdown(): void {
    const handleShutdown = async (signal: string) => {
      console.log(`\nReceived ${signal}. Shutting down gracefully...`);

      try {
        // Clean up LLM adapter resources (prompt cache interval, etc.)
        DIContainer.llmProvider.destroy();

        // Close queue connections
        await DIContainer.queueService.close();
        console.log('Queue service closed.');

        await this.mongo.close();
        console.log('MongoDB connection closed.');
        process.exit(0);
      } catch (error) {
        console.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGINT', () => handleShutdown('SIGINT'));
    process.on('SIGTERM', () => handleShutdown('SIGTERM'));
  }

  public static getMongo(): Mongoose | undefined {
    if (!this.mongo) {
      throw new Error('CoreLoader.mongo is not initialized. Call init() first.');
    }
    return this.mongo.getDb();
  }

  public static getVector(): QdrantClient {
    if (!this.vector) {
      throw new Error('CoreLoader.vector is not initialized. Call init() first.');
    }
    return this.vector.getClient() as QdrantClient;
  }
}
