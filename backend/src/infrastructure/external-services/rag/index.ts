import { QdrantClient } from '@qdrant/js-client-rest';
import { CoreLoader } from '../../index';
import { OllamaEmbeddingProvider, IEmbeddingProvider } from '../memory/embedding';
import { aiConfig } from '../../configs';
import { logger } from '../../utils/logger';

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

  private mapResult(r: any): RagResult {
    return {
      docId: (r.payload?.['docId'] as string) || (r.id as string),
      text: (r.payload?.['text'] as string) || '',
      score: r.score ?? 0,
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
    };
  }

  public async query(input: RagInput): Promise<{ ok: boolean; context: RagResult[] }> {
    const collectionName = this.getCollectionName(input.agentId);

    logger.info('[RAG] Query started', {
      agentId: input.agentId,
      collectionName,
      query: input.query?.substring(0, 100),
      topK: input.topK,
    });

    // Guard against undefined or empty query
    const query = input.query || '';
    if (!query.trim()) {
      logger.warn('[RAG] Empty query received, returning empty context');
      return { ok: true, context: [] };
    }

    try {
      const collections = await this.vectorClient.getCollections();
      const exists = collections.collections.some((c) => c.name === collectionName);

      logger.info('[RAG] Collection check', {
        collectionName,
        exists,
        totalCollections: collections.collections.length,
        availableCollections: collections.collections.map((c) => c.name),
      });

      if (!exists) {
        logger.warn('[RAG] Collection not found', { collectionName });
        return { ok: true, context: [] };
      }

      logger.info('[RAG] Generating embedding for query', {
        query: query.substring(0, 100),
      });

      const embedding = await this.embeddingProvider.embed(query, 'query');

      logger.info('[RAG] Embedding generated', {
        embeddingLength: embedding.length,
        embeddingSample: embedding.slice(0, 5),
      });

      // Vector search
      const results = await this.vectorClient.search(collectionName, {
        vector: embedding,
        limit: input.topK || aiConfig.rag.defaultTopK,
        with_payload: true,
      });

      logger.info('[RAG] Vector search completed', {
        resultsCount: results.length,
        scores: results.map((r) => r.score?.toFixed(4)),
      });

      const context: RagResult[] = results.map((r) => this.mapResult(r));

      // Log each result for debugging
      context.forEach((result, index) => {
        const emails = (result.metadata['emails'] as string[]) || [];
        const socialLinks = (result.metadata['socialLinks'] as Record<string, string>) || {};

        logger.info(`[RAG] Result ${index + 1}`, {
          score: result.score.toFixed(4),
          chunkIndex: result.citation.chunkIndex,
          fileName: result.citation.fileName,
          textPreview: result.text.substring(0, 150),
          hasEmails: emails.length > 0,
          hasSocialLinks: Object.keys(socialLinks).length > 0,
          emails,
          socialLinks,
        });
      });

      logger.info('[RAG] Query completed successfully', {
        totalResults: context.length,
      });

      return { ok: true, context };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error('[RAG] Query failed', { error: message, query: query.substring(0, 100) });
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
