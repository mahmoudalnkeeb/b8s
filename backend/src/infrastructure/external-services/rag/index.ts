import { QdrantClient } from '@qdrant/js-client-rest';
import { CoreLoader } from '../../index';
import { OllamaEmbeddingProvider, IEmbeddingProvider } from '../memory/embedding';
import { aiConfig } from '../../configs';

export interface RagInput {
  agentId: string;
  query: string;
  topK?: number;
}

export interface RagResult {
  docId: string;
  text: string;
  score: number;
  metadata: Record<string, unknown>;
}

export class RagService {
  private _vectorClient?: QdrantClient;
  private embeddingProvider: IEmbeddingProvider;

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
    return `kb_${agentId.replace(/-/g, '_')}`;
  }

  public async query(input: RagInput): Promise<{ ok: boolean; context: RagResult[] }> {
    const collectionName = this.getCollectionName(input.agentId);

    try {
      const collections = await this.vectorClient.getCollections();
      const exists = collections.collections.some((c) => c.name === collectionName);
      if (!exists) return { ok: true, context: [] };

      const embedding = await this.embeddingProvider.embed(input.query, 'query');

      const results = await this.vectorClient.search(collectionName, {
        vector: embedding,
        limit: input.topK || aiConfig.rag.defaultTopK,
        with_payload: true,
      });

      const context: RagResult[] = results.map((r) => ({
        docId: (r.payload?.['docId'] as string) || (r.id as string),
        text: (r.payload?.['text'] as string) || '',
        score: r.score,
        metadata: (r.payload?.['metadata'] as Record<string, unknown>) || {},
      }));

      return { ok: true, context };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error('RAG Error:', message);
      return { ok: false, context: [] };
    }
  }

  public async deleteDocument(agentId: string, docId: string) {
    const collectionName = this.getCollectionName(agentId);
    try {
      await this.vectorClient.delete(collectionName, {
        filter: {
          must: [
            {
              key: 'docId',
              match: { value: docId },
            },
          ],
        },
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Failed to delete vectors for doc ${docId}:`, message);
    }
  }
}
