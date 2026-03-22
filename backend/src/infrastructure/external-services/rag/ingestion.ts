import { QdrantClient } from '@qdrant/js-client-rest';
import { CoreLoader } from '../../index';
import { OllamaEmbeddingProvider, IEmbeddingProvider } from '../memory/embedding';
import { randomUUID } from 'crypto';
import { IngestionJobModel, JobStatus } from '../../db/models';
import { logger } from '../../utils/logger';
import { aiConfig } from '../../configs';

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

  /**
   * Word-aware recursive character splitter
   */
  private chunkText(
    text: string,
    chunkSize = aiConfig.rag.chunkSize,
    overlap = aiConfig.rag.chunkOverlap,
  ): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = start + chunkSize;

      if (end < text.length) {
        const lastSpace = text.lastIndexOf(' ', end);
        if (lastSpace > start + chunkSize * 0.5) {
          end = lastSpace;
        }
      }

      chunks.push(text.substring(start, end).trim());
      start = end - overlap;

      if (start < 0) start = 0;
      if (start >= end) start = end;
    }

    return chunks.filter((c) => c.length > 0);
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
      const chunks = this.chunkText(content);

      await IngestionJobModel.findOneAndUpdate(
        { jobId },
        { status: JobStatus.PROCESSING, totalChunks: chunks.length },
      );

      logger.info(`Ingesting ${fileName} for agent ${agentId}: ${chunks.length} chunks`);

      const BATCH_SIZE = aiConfig.rag.batchSize;
      const allPoints: { id: string; vector: number[]; payload: Record<string, unknown> }[] = [];

      for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
        const batch = chunks.slice(i, i + BATCH_SIZE);

        logger.debug(`Processing chunk ${i + 1}/${chunks.length} for ${fileName}`);
        const embeddings = await this.embeddingProvider.embedBatch(batch, 'document');

        const points = batch.map((chunk, index) => ({
          id: randomUUID(),
          vector: embeddings[index] || [],
          payload: {
            docId,
            agentId,
            text: chunk,
            fileName,
            chunkIndex: i + index,
            createdAt: new Date().toISOString(),
          },
        }));

        allPoints.push(...points);

        await IngestionJobModel.findOneAndUpdate(
          { jobId },
          { processedChunks: Math.min(i + BATCH_SIZE, chunks.length) },
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
        { status: JobStatus.COMPLETED, processedChunks: chunks.length },
      );

      logger.info(`Ingestion completed for ${fileName}`);
      return { ok: true, chunksCount: chunks.length };
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
