import { QdrantClient } from '@qdrant/js-client-rest';
import { CoreLoader } from '../../index';
import { OllamaEmbeddingProvider, IEmbeddingProvider } from '../memory/embedding';
import { randomUUID } from 'crypto';
import { IngestionJobModel, JobStatus } from '../../db/models';
import { logger } from '../../utils/logger';
import { aiConfig } from '../../configs';
import { extractMetadata } from '../../utils/metadata-extractor';
import { semanticChunk, mergeSmallChunks } from '../../utils/semantic-chunker';

export class IngestionService {
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
    return `kb_${agentId.replace(/-/g, '_')}`;
  }

  private async ensureCollection(agentId: string): Promise<string> {
    const collectionName = this.getCollectionName(agentId);
    try {
      const collections = await this.vectorClient.getCollections();
      const exists = collections.collections.some((c) => c.name === collectionName);

      if (exists) {
        const info = await this.vectorClient.getCollection(collectionName);
        const vectors = info.config.params.vectors;

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
          `Checking collection ${collectionName}: currentDim=${currentDim}, expected=${this.VECTOR_SIZE}`,
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
      logger.error('Error ensuring KB collection:', error);
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
    logger.info(`Created collection: ${name} with dimension ${this.VECTOR_SIZE}`);
  }

  public async ingestDocument(
    agentId: string,
    docId: string,
    content: string,
    fileName: string,
    jobId: string,
  ) {
    try {
      const collectionName = await this.ensureCollection(agentId);

      // Use semantic chunking instead of character-based
      const rawChunks = semanticChunk(content, {
        maxChunkSize: aiConfig.rag.chunkSize * 3, // Allow larger chunks for semantic grouping
        minChunkSize: 50,
        overlap: aiConfig.rag.chunkOverlap,
      });

      // Merge small chunks that share metadata
      const semanticChunks = mergeSmallChunks(rawChunks, 200);
      const chunkTexts = semanticChunks.map((c) => c.text);

      await IngestionJobModel.findOneAndUpdate(
        { jobId },
        { status: JobStatus.PROCESSING, totalChunks: chunkTexts.length },
      );

      logger.info(
        `Ingesting ${fileName} for agent ${agentId}: ${chunkTexts.length} semantic chunks`,
      );

      // Extract metadata from full document for fallback
      const documentMetadata = extractMetadata(content);
      logger.info(`Extracted metadata from ${fileName}:`, {
        urls: documentMetadata.urls.length,
        emails: documentMetadata.emails.length,
        phones: documentMetadata.phones.length,
        socialLinks: Object.keys(documentMetadata.socialLinks).length,
      });

      const BATCH_SIZE = aiConfig.rag.batchSize;
      const allPoints: { id: string; vector: number[]; payload: Record<string, unknown> }[] = [];

      for (let i = 0; i < chunkTexts.length; i += BATCH_SIZE) {
        const batch = chunkTexts.slice(i, i + BATCH_SIZE);
        const batchChunks = semanticChunks.slice(i, i + BATCH_SIZE);

        logger.debug(`Processing chunk ${i + 1}/${chunkTexts.length} for ${fileName}`);
        const embeddings = await this.embeddingProvider.embedBatch(batch, 'document');

        const points = batch.map((chunk, index) => {
          const semanticChunk = batchChunks[index];
          // Use chunk's own metadata, fall back to document metadata
          const chunkMeta = semanticChunk?.metadata || {
            urls: [],
            emails: [],
            phones: [],
            socialLinks: {},
          };

          return {
            id: randomUUID(),
            vector: embeddings[index] || [],
            payload: {
              docId,
              agentId,
              text: chunk,
              fileName,
              chunkIndex: i + index,
              createdAt: new Date().toISOString(),
              // Store extracted metadata for hybrid search
              urls: chunkMeta.urls.length > 0 ? chunkMeta.urls : documentMetadata.urls,
              emails: chunkMeta.emails.length > 0 ? chunkMeta.emails : documentMetadata.emails,
              phones: chunkMeta.phones.length > 0 ? chunkMeta.phones : documentMetadata.phones,
              socialLinks:
                Object.keys(chunkMeta.socialLinks).length > 0
                  ? chunkMeta.socialLinks
                  : documentMetadata.socialLinks,
            },
          };
        });

        allPoints.push(...points);

        await IngestionJobModel.findOneAndUpdate(
          { jobId },
          { processedChunks: Math.min(i + BATCH_SIZE, chunkTexts.length) },
        );
      }

      for (let i = 0; i < allPoints.length; i += aiConfig.rag.upsertBatchSize) {
        const batchPoints = allPoints.slice(i, i + aiConfig.rag.upsertBatchSize);
        await this.vectorClient.upsert(collectionName, {
          wait: true,
          points: batchPoints,
        });
      }

      await IngestionJobModel.findOneAndUpdate(
        { jobId },
        { status: JobStatus.COMPLETED, processedChunks: chunkTexts.length },
      );

      logger.info(`Ingestion completed for ${fileName}: ${chunkTexts.length} chunks`);
      return { ok: true, chunksCount: chunkTexts.length };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Ingestion failed for job ${jobId}:`, message);
      await IngestionJobModel.findOneAndUpdate(
        { jobId },
        { status: JobStatus.FAILED, error: message },
      );
      throw error;
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
      logger.info(`Deleted vectors for doc ${docId} from ${collectionName}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      logger.error(`Failed to delete vectors for doc ${docId}:`, message);
    }
  }
}
