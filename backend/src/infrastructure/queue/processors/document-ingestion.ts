import { Job } from 'bullmq';
import { randomUUID } from 'crypto';
import { IngestionService } from '@/infrastructure/external-services/rag/ingestion';
import { IngestionJobModel } from '@/infrastructure/db/models';
import { JobStatus } from '@/domain/models';
import { aiConfig } from '@/infrastructure/configs';
import { logger } from '@/infrastructure/utils/logger';
import { JobProcessor, JobData } from '../queue-service';
import { extractMetadata } from '@/infrastructure/utils/metadata-extractor';

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

    // Chunk the text
    const chunks = chunkText(content);
    logger.info(`Document ${fileName} chunked into ${chunks.length} chunks`);

    // Extract metadata from full document
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
        const chunkMetadata = extractMetadata(chunk);
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
            urls: chunkMetadata.urls.length > 0 ? chunkMetadata.urls : documentMetadata.urls,
            emails:
              chunkMetadata.emails.length > 0 ? chunkMetadata.emails : documentMetadata.emails,
            phones:
              chunkMetadata.phones.length > 0 ? chunkMetadata.phones : documentMetadata.phones,
            socialLinks:
              Object.keys(chunkMetadata.socialLinks).length > 0
                ? chunkMetadata.socialLinks
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
 * Word-aware recursive character splitter
 */
function chunkText(
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
