import mongoose, { Mongoose } from 'mongoose';
import { env } from '../loaders/env';
import { databaseConfig } from '../configs';

export class MongoDbClient {
  private static instance: MongoDbClient;
  private connection?: Mongoose | undefined;

  private constructor() {
    const uri = env.MONGODB_URI;
    if (!uri) {
      throw new Error('MONGODB_URI is not defined in environment variables');
    }
  }

  public static getInstance(): MongoDbClient {
    if (!MongoDbClient.instance) {
      MongoDbClient.instance = new MongoDbClient();
    }
    return MongoDbClient.instance;
  }

  public async connect(): Promise<void> {
    if (!this.connection) {
      const uri = env.MONGODB_URI;
      this.connection = await mongoose.connect(uri, {
        maxPoolSize: databaseConfig.mongo.maxPoolSize,
        minPoolSize: databaseConfig.mongo.minPoolSize,
        serverSelectionTimeoutMS: databaseConfig.mongo.serverSelectionTimeoutMS,
      });
      console.log('Successfully connected to MongoDB via Mongoose');
    }
  }

  public async close(): Promise<void> {
    if (this.connection) {
      await mongoose.connection.close();
      this.connection = undefined;
    }
  }

  public getDb() {
    return MongoDbClient.getInstance().connection;
  }
}
