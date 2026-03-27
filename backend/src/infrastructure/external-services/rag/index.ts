import { QdrantClient } from '@qdrant/js-client-rest';
import { CoreLoader } from '../../index';
import { OllamaEmbeddingProvider, IEmbeddingProvider } from '../memory/embedding';
import { aiConfig } from '../../configs';
import { RagValidationService } from './validation';

export interface RagInput {
  agentId: string;
  query: string;
  topK?: number;
}

export interface RagCitation {
  fileName: string;
  chunkIndex: number;
  totalChunks?: number;
  docId: string;
}

export interface RagResult {
  docId: string;
  text: string;
  score: number;
  metadata: Record<string, unknown>;
  citation: RagCitation;
}

export class RagService {
  private _vectorClient?: QdrantClient;
  private embeddingProvider: IEmbeddingProvider;
  private validationService: RagValidationService;

  constructor() {
    this.embeddingProvider = new OllamaEmbeddingProvider();
    this.validationService = new RagValidationService();
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

  public async query(
    input: RagInput,
  ): Promise<{ ok: boolean; context: RagResult[]; validationSummary?: string }> {
    const collectionName = this.getCollectionName(input.agentId);

    // Guard against undefined or empty query
    const query = input.query || '';
    if (!query.trim()) {
      return { ok: true, context: [], validationSummary: 'No query provided.' };
    }

    try {
      const collections = await this.vectorClient.getCollections();
      const exists = collections.collections.some((c) => c.name === collectionName);
      if (!exists) return { ok: true, context: [] };

      const embedding = await this.embeddingProvider.embed(query, 'query');

      const results = await this.vectorClient.search(collectionName, {
        vector: embedding,
        limit: input.topK || aiConfig.rag.defaultTopK,
        with_payload: true,
      });

      const context: RagResult[] = results.map((r) => ({
        docId: (r.payload?.['docId'] as string) || (r.id as string),
        text: (r.payload?.['text'] as string) || '',
        score: r.score,
        metadata: {
          urls: r.payload?.['urls'] || [],
          emails: r.payload?.['emails'] || [],
          phones: r.payload?.['phones'] || [],
          socialLinks: r.payload?.['socialLinks'] || {},
        },
        citation: {
          fileName: (r.payload?.['fileName'] as string) || 'Unknown',
          chunkIndex: (r.payload?.['chunkIndex'] as number) || 0,
          docId: (r.payload?.['docId'] as string) || (r.id as string),
        },
      }));

      // Validate results with secondary model
      const validation = await this.validationService.validateResults(query, context);

      // Return only relevant results
      const relevantContext = validation.hasRelevantResults
        ? validation.validatedResults.filter((r) => r.isRelevant)
        : validation.validatedResults;

      return {
        ok: true,
        context: relevantContext,
        validationSummary: validation.validationSummary,
      };
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
