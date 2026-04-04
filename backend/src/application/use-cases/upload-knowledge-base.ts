import { randomUUID } from 'crypto';
import { IKnowledgeBaseRepository } from '../../domain/ports/knowledge-base-repository';
import { IAgentRepository } from '../../domain/ports/agent-repository';
import { JobStatus } from '../../domain/models';
import { NotFoundError, UnauthorizedError, BadRequestError } from '../../domain/errors';
import type { QueueService } from '../../infrastructure/queue/queue-service';
import { logger } from '../../infrastructure/utils/logger';

export interface UploadKnowledgeBaseRequest {
  agentId: string;
  userId: string;
  fileName: string;
  fileBuffer: Buffer;
  mimeType: string;
}

export interface UploadKnowledgeBaseResult {
  success: boolean;
  jobId: string;
  queueJobId: string;
}

export class UploadKnowledgeBaseUseCase {
  constructor(
    private kbRepo: IKnowledgeBaseRepository,
    private agentRepo: IAgentRepository,
    private queueService: QueueService,
  ) {}

  async execute(request: UploadKnowledgeBaseRequest): Promise<UploadKnowledgeBaseResult> {
    const { agentId, userId, fileName, fileBuffer, mimeType } = request;

    const agent = await this.agentRepo.findById(agentId);
    if (!agent) throw new NotFoundError('Agent not found', 'AGENT_NOT_FOUND');
    if (agent.ownerId !== userId) throw new UnauthorizedError('Unauthorized', 'UNAUTHORIZED');

    const jobId = randomUUID();
    const docId = randomUUID();

    await this.kbRepo.createDoc({
      docId,
      agentId,
      fileName,
      content: '',
      metadata: { userId },
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await this.kbRepo.createJob({
      jobId,
      agentId,
      fileName,
      status: JobStatus.PENDING,
      totalChunks: 0,
      processedChunks: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const content = await this.parseFileContent(fileName, mimeType, fileBuffer);

    const job = await this.queueService.addJob(
      'document-ingestion',
      'documentIngestion',
      {
        agentId,
        docId,
        content,
        fileName,
        jobId,
      },
      {
        jobId,
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
      },
    );

    return {
      success: true,
      jobId,
      queueJobId: job.id as string,
    };
  }

  private async parseFileContent(
    fileName: string,
    mimeType: string,
    buffer: Buffer,
  ): Promise<string> {
    // Extract extension properly (handles double dots like 'file..pdf')
    const ext = fileName.toLowerCase().split('.').pop();
    const isPdf = ext === 'pdf' || mimeType === 'application/pdf';

    if (isPdf) {
      // Validate PDF header
      const pdfHeader = buffer.slice(0, 5).toString();
      if (pdfHeader !== '%PDF-') {
        logger.warn('Invalid PDF file uploaded', { fileName, header: pdfHeader });
        throw new BadRequestError(
          'Invalid PDF file. The file must be a valid PDF document.',
          'INVALID_PDF',
        );
      }

      try {
        const pdfParse = await import('pdf-parse');
        const parser = new pdfParse.PDFParse({ data: buffer });
        const parsed = await parser.getText();
        return parsed.text;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger.error('PDF parsing failed', { fileName, error: message });
        throw new BadRequestError(
          'Failed to parse PDF file. The file may be corrupted, password-protected, or in an unsupported format.',
          'PDF_PARSE_ERROR',
        );
      }
    }

    // Default: return buffer as utf-8 string
    return buffer.toString('utf-8');
  }
}
