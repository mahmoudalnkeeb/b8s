import { randomUUID } from 'crypto';
import { IKnowledgeBaseRepository } from '../../domain/ports/knowledge-base-repository';
import { IAgentRepository } from '../../domain/ports/agent-repository';
import { JobStatus } from '../../domain/models';
import { NotFoundError, UnauthorizedError } from '../../domain/errors';
import type { QueueService } from '../../infrastructure/queue/queue-service';

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
    if (fileName.toLowerCase().endsWith('.pdf') || mimeType === 'application/pdf') {
      const pdfParse = await import('pdf-parse');
      const parser = new pdfParse.PDFParse({ data: buffer });
      const parsed = await parser.getText();
      return parsed.text;
    }
    return buffer.toString('utf-8');
  }
}
