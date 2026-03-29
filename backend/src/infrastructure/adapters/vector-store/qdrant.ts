import { QdrantClient } from '@qdrant/js-client-rest';
import { IVectorStore } from '../../../domain/ports/vector-store';
import { IMemory } from '../../../domain/models';
import { DatabaseError } from '../../../domain/errors';

export class QdrantAdapter implements IVectorStore {
  private client: QdrantClient;

  constructor(url: string, apiKey: string = '') {
    this.client = new QdrantClient({ url, apiKey });
  }

  async upsert(collection: string, memory: IMemory): Promise<void> {
    try {
      if (!memory.vector) throw new Error('Vector is required for Qdrant upsert');
      await this.client.upsert(collection, {
        wait: true,
        points: [
          {
            id: memory.id,
            vector: memory.vector,
            payload: { ...memory.metadata, content: memory.content },
          },
        ],
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);

      if (
        message === 'Not Found' ||
        message.includes('Not Found') ||
        message.includes('Not found')
      ) {
        try {
          // eslint-disable-next-line preserve-caught-error
          if (!memory.vector) throw new Error('Vector is required for collection creation');
          await this.client.createCollection(collection, {
            vectors: {
              size: memory.vector.length,
              distance: 'Cosine',
            },
          });

          // Retry upsert after creating collection
          await this.client.upsert(collection, {
            wait: true,
            points: [
              {
                id: memory.id,
                vector: memory.vector,
                payload: { ...memory.metadata, content: memory.content },
              },
            ],
          });
          return;
        } catch (retryError: unknown) {
          const retryMessage =
            retryError instanceof Error ? retryError.message : String(retryError);
          throw new DatabaseError(
            `Failed to create collection and retry: ${retryMessage}`,
            'QDRANT_UPSERT_ERROR',
          );
        }
      }

      throw new DatabaseError(message, 'QDRANT_UPSERT_ERROR');
    }
  }

  async similaritySearch(
    collection: string,
    queryVector: number[],
    limit: number,
  ): Promise<IMemory[]> {
    try {
      const results = await this.client.search(collection, {
        vector: queryVector,
        limit,
      });
      return results.map((res) => ({
        id: res.id.toString(),
        content: (res.payload?.['content'] as string) || '',
        metadata: (res.payload as Record<string, unknown>) || {},
        createdAt: new Date(),
      }));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);

      if (
        message === 'Not Found' ||
        message.includes('Not Found') ||
        message.includes('Not found')
      ) {
        return [];
      }

      throw new DatabaseError(message, 'QDRANT_SEARCH_ERROR');
    }
  }
}
