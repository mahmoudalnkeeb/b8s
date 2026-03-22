import { QdrantClient } from '@qdrant/js-client-rest';
import { CoreLoader } from '../../index';
import { OllamaEmbeddingProvider, IEmbeddingProvider } from './embedding';
import { randomUUID } from 'crypto';
import { MemoryReadAccess, MemoryWriteAccess } from '../../db/models';
import { logger } from '../../utils/logger';
import { aiConfig } from '../../configs';

export interface MemorySetInput {
  agentId: string;
  conversationId: string;
  text: string;
  currentUserId: string;
  ownerId: string;
  writeAccess: MemoryWriteAccess;
  metadata: {
    userId: string;
    tags?: string[];
    importance?: number;
  };
}

export interface MemoryGetInput {
  agentId: string;
  query: string;
  currentUserId: string;
  ownerId: string;
  readAccess: MemoryReadAccess;
  topK?: number;
  filters?: {
    conversationId?: string;
    tags?: string[];
  };
}

export interface MemoryItem {
  memoryId: string;
  text: string;
  score: number;
}

export class MemoryService {
  private _vectorClient?: QdrantClient;
  private embeddingProvider: IEmbeddingProvider;
  private readonly VECTOR_SIZE = aiConfig.vector.dimensionSize;

  constructor() {
    this.embeddingProvider = new OllamaEmbeddingProvider();
  }

  private get vectorClient(): QdrantClient {
    if (!this._vectorClient) {
      this._vectorClient = CoreLoader.getVector();
    }
    return this._vectorClient;
  }

  private getCollectionName(agentId: string): string {
    return `mem_${agentId.replace(/-/g, '_')}`;
  }

  private async ensureCollection(agentId: string): Promise<string> {
    const collectionName = this.getCollectionName(agentId);

    try {
      const collections = await this.vectorClient.getCollections();
      const exists = collections.collections.some((c) => c.name === collectionName);

      if (exists) {
        const info = await this.vectorClient.getCollection(collectionName);
        const vectors = info.config.params.vectors;

        // Handle potential different shapes of vectors config
        let currentDim = 0;
        if (vectors && 'size' in vectors) {
          currentDim = (vectors as { size: number }).size;
        } else if (vectors) {
          const firstVector = Object.values(vectors)[0];
          if (firstVector && typeof firstVector === 'object' && 'size' in firstVector) {
            currentDim = (firstVector as { size: number }).size;
          }
        }

        logger.info(
          `Checking memory collection ${collectionName}: currentDim=${currentDim}, expected=${this.VECTOR_SIZE}`,
        );

        if (currentDim && currentDim !== this.VECTOR_SIZE) {
          logger.warn(`Dimension mismatch for ${collectionName}. Recreating...`);
          await this.vectorClient.deleteCollection(collectionName);
          await new Promise((r) => setTimeout((resolve) => r(resolve), 500));
          await this.createCollection(collectionName);
        }
      } else {
        await this.createCollection(collectionName);
      }
    } catch (error) {
      logger.error('Error ensuring memory collection:', error);
    }

    return collectionName;
  }

  private async createCollection(name: string) {
    await this.vectorClient.createCollection(name, {
      vectors: {
        size: this.VECTOR_SIZE,
        distance: 'Cosine',
      },
    });
    logger.info(`Created memory collection: ${name} with dimension ${this.VECTOR_SIZE}`);
  }

  public async set(
    input: MemorySetInput,
  ): Promise<{ ok: boolean; memoryId: string; error?: string }> {
    // Check WRITE access
    if (input.writeAccess === MemoryWriteAccess.PRIVATE && input.currentUserId !== input.ownerId) {
      return {
        ok: false,
        memoryId: '',
        error: 'Forbidden: Only the owner can add memories to this agent.',
      };
    }

    const collectionName = await this.ensureCollection(input.agentId);
    const embedding = await this.embeddingProvider.embed(input.text, 'document');
    const memoryId = randomUUID();

    await this.vectorClient.upsert(collectionName, {
      wait: true,
      points: [
        {
          id: memoryId,
          vector: embedding,
          payload: {
            conversationId: input.conversationId,
            text: input.text,
            userId: input.metadata.userId,
            tags: input.metadata.tags || [],
            importance: input.metadata.importance || 0,
            createdAt: new Date().toISOString(),
          },
        },
      ],
    });

    return { ok: true, memoryId };
  }

  public async get(input: MemoryGetInput): Promise<{ ok: boolean; items: MemoryItem[] }> {
    const collectionName = await this.ensureCollection(input.agentId);

    const embedding = await this.embeddingProvider.embed(input.query, 'query');

    const mustFilters: unknown[] = [];

    // Apply READ access filters
    if (input.readAccess === MemoryReadAccess.PRIVATE) {
      if (input.currentUserId !== input.ownerId) {
        return { ok: true, items: [] };
      }
      mustFilters.push({
        key: 'userId',
        match: { value: input.ownerId },
      });
    } else if (input.readAccess === MemoryReadAccess.CREATED_ONLY) {
      mustFilters.push({
        key: 'userId',
        match: { value: input.currentUserId },
      });
    }

    if (input.filters?.conversationId) {
      mustFilters.push({
        key: 'conversationId',
        match: { value: input.filters.conversationId },
      });
    }

    if (input.filters?.tags && input.filters.tags.length > 0) {
      mustFilters.push({
        key: 'tags',
        match: { any: input.filters.tags },
      });
    }

    const searchParams: any = {
      vector: embedding,
      limit: input.topK || aiConfig.memory.defaultTopK,
      with_payload: true,
    };

    if (mustFilters.length > 0) {
      searchParams.filter = { must: mustFilters };
    }

    const results = await this.vectorClient.search(collectionName, searchParams);

    const items: MemoryItem[] = results.map((r) => ({
      memoryId: r.id as string,
      text: (r.payload?.['text'] as string) || '',
      score: r.score,
    }));

    return { ok: true, items };
  }

  public async list(
    agentId: string,
    limit = aiConfig.memory.scrollLimit,
  ): Promise<{ ok: boolean; items: MemoryItem[] }> {
    const collectionName = await this.ensureCollection(agentId);

    try {
      const result = await this.vectorClient.scroll(collectionName, {
        limit,
        with_payload: true,
        with_vector: false,
      });

      const items: MemoryItem[] = result.points.map((p) => ({
        memoryId: p.id as string,
        text: (p.payload?.['text'] as string) || '',
        score: 1, // No score for scroll
      }));

      return { ok: true, items };
    } catch (error) {
      console.error('Error listing memories:', error);
      return { ok: false, items: [] };
    }
  }
}
