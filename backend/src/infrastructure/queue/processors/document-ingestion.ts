import { Job } from 'bullmq';
import { randomUUID } from 'crypto';
import { IngestionService } from '@/infrastructure/external-services/rag/ingestion';
import { IngestionJobModel } from '@/infrastructure/db/models';
import { JobStatus } from '@/domain/models';
import { aiConfig } from '@/infrastructure/configs';
import { logger } from '@/infrastructure/utils/logger';
import { JobProcessor, JobData } from '../queue-service';
import { extractMetadata } from '@/infrastructure/utils/metadata-extractor';
import { semanticChunk, mergeSmallChunks } from '@/infrastructure/utils/semantic-chunker';

export interface DocumentIngestionJobData extends JobData {
  agentId: string;
  docId: string;
  content: string;
  fileName: string;
  jobId: string;
}

/**
 * Document ingestion job processor for BullMQ
 * This processor handles async document processing with progress tracking
 */
export async function documentIngestionProcessor(job: Job<DocumentIngestionJobData>): Promise<{
  success: boolean;
  chunksCount: number;
  message?: string;
}> {
  const { agentId, docId, content, fileName, jobId } = job.data;

  logger.info(`Starting document ingestion for job ${job.id}`, {
    agentId,
    fileName,
    jobId,
  });

  try {
    // Update job status to processing in MongoDB
    await IngestionJobModel.findOneAndUpdate(
      { jobId },
      { status: JobStatus.PROCESSING, startedAt: new Date() },
    );

    // Initialize ingestion service
    const ingestionService = new IngestionService();

    // Get collection name
    const collectionName = await ingestionService['ensureCollection'](agentId);

    // Use semantic chunking instead of character-based
    const rawChunks = semanticChunk(content, {
      maxChunkSize: aiConfig.rag.chunkSize * 3, // Allow larger chunks for semantic grouping
      minChunkSize: 50,
      overlap: aiConfig.rag.chunkOverlap,
    });

    // Merge small chunks that share metadata
    const semanticChunks = mergeSmallChunks(rawChunks, 200);
    const chunks = semanticChunks.map((c) => c.text);

    logger.info(`Document ${fileName} chunked into ${chunks.length} semantic chunks`);

    // Extract metadata from full document for fallback
    const documentMetadata = extractMetadata(content);
    logger.info(`Extracted metadata from ${fileName}:`, {
      urls: documentMetadata.urls.length,
      emails: documentMetadata.emails.length,
      phones: documentMetadata.phones.length,
      socialLinks: Object.keys(documentMetadata.socialLinks).length,
    });

    // Update total chunks in job
    await IngestionJobModel.findOneAndUpdate({ jobId }, { totalChunks: chunks.length });

    const BATCH_SIZE = aiConfig.rag.batchSize;
    const allPoints: { id: string; vector: number[]; payload: Record<string, unknown> }[] = [];

    // Process chunks in batches
    for (let i = 0; i < chunks.length; i += BATCH_SIZE) {
      const batch = chunks.slice(i, i + BATCH_SIZE);
      const batchChunks = semanticChunks.slice(i, i + BATCH_SIZE);
      const batchNumber = Math.floor(i / BATCH_SIZE) + 1;
      const totalBatches = Math.ceil(chunks.length / BATCH_SIZE);

      logger.debug(`Processing batch ${batchNumber}/${totalBatches} for ${fileName}`);

      // Update progress in BullMQ
      const progressPercent = Math.round(((i + batch.length) / chunks.length) * 100);
      await job.updateProgress(progressPercent);

      // Generate embeddings for batch
      const { OllamaEmbeddingProvider } =
        await import('@/infrastructure/external-services/memory/embedding');
      const embeddingProvider = new OllamaEmbeddingProvider();
      const embeddings = await embeddingProvider.embedBatch(batch, 'document');

      // Create points for Qdrant with metadata
      const points = batch.map((chunk, index) => {
        const semanticChunk = batchChunks[index];
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

      // Update processed chunks in MongoDB
      await IngestionJobModel.findOneAndUpdate(
        { jobId },
        { processedChunks: Math.min(i + BATCH_SIZE, chunks.length) },
      );
    }

    // Upsert all points to Qdrant in batches
    const { CoreLoader } = await import('@/infrastructure');
    const vectorClient = CoreLoader.getVector();

    for (let i = 0; i < allPoints.length; i += aiConfig.rag.upsertBatchSize) {
      const batchPoints = allPoints.slice(i, i + aiConfig.rag.upsertBatchSize);
      await vectorClient.upsert(collectionName, {
        wait: true,
        points: batchPoints,
      });
    }

    // Update job status to completed
    await IngestionJobModel.findOneAndUpdate(
      { jobId },
      {
        status: JobStatus.COMPLETED,
        processedChunks: chunks.length,
        completedAt: new Date(),
      },
    );

    // Final progress update
    await job.updateProgress(100);

    logger.info(`Document ingestion completed for job ${job.id}`, {
      chunksCount: chunks.length,
      fileName,
    });

    return {
      success: true,
      chunksCount: chunks.length,
      message: `Successfully processed ${chunks.length} chunks`,
    };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);

    logger.error(`Document ingestion failed for job ${job.id}:`, {
      error: message,
      agentId,
      fileName,
    });

    // Update job status to failed in MongoDB
    await IngestionJobModel.findOneAndUpdate(
      { jobId },
      {
        status: JobStatus.FAILED,
        error: message,
        failedAt: new Date(),
      },
    );

    // Throw to trigger BullMQ retry logic
    throw error;
  }
}

/**
 * Job processor configuration
 */
export const ingestionJobProcessorConfig: JobProcessor<DocumentIngestionJobData> = {
  name: 'documentIngestion',
  handler: documentIngestionProcessor,
  options: {
    concurrency: 2, // Process 2 documents simultaneously
    limiter: {
      max: 10, // Max 10 jobs per minute
      duration: 60000,
    },
  },
};
