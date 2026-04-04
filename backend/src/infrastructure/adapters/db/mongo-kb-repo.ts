import { IKnowledgeBaseRepository } from '../../../domain/ports/knowledge-base-repository';
import { IKnowledgeBaseDoc, IIngestionJob, JobStatus } from '../../../domain/models';
import { DatabaseError } from '../../../domain/errors';
import {
  KnowledgeBaseDocModel,
  IngestionJobModel,
  IKnowledgeBaseDoc as IKnowledgeBaseDocDoc,
  IIngestionJob as IIngestionJobDoc,
} from '../../db/models';

export class MongoKnowledgeBaseRepository implements IKnowledgeBaseRepository {
  private mapDocToDomain(doc: IKnowledgeBaseDocDoc): IKnowledgeBaseDoc {
    const obj = doc.toObject() as IKnowledgeBaseDocDoc & { createdAt: Date; updatedAt: Date };
    const domainDoc: IKnowledgeBaseDoc = {
      docId: obj.docId,
      agentId: obj.agentId,
      fileName: obj.fileName,
      metadata: obj.metadata || {},
    };

    if (obj.content) {
      domainDoc.content = obj.content;
    }
    if (obj.createdAt) {
      domainDoc.createdAt = obj.createdAt;
    }
    if (obj.updatedAt) {
      domainDoc.updatedAt = obj.updatedAt;
    }

    return domainDoc;
  }

  private mapJobToDomain(job: IIngestionJobDoc): IIngestionJob {
    const obj = job.toObject() as IIngestionJobDoc & { createdAt: Date; updatedAt: Date };
    const domainJob: IIngestionJob = {
      jobId: obj.jobId,
      agentId: obj.agentId,
      fileName: obj.fileName,
      status: obj.status as JobStatus,
      totalChunks: obj.totalChunks,
      processedChunks: obj.processedChunks,
    };

    if (obj.error) {
      domainJob.error = obj.error;
    }
    if (obj.createdAt) {
      domainJob.createdAt = obj.createdAt;
    }
    if (obj.updatedAt) {
      domainJob.updatedAt = obj.updatedAt;
    }

    return domainJob;
  }

  async createDoc(doc: IKnowledgeBaseDoc): Promise<void> {
    try {
      await KnowledgeBaseDocModel.create(doc as unknown as any);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_SAVE_KB_DOC_ERROR');
    }
  }

  async listDocs(agentId: string): Promise<IKnowledgeBaseDoc[]> {
    try {
      const docs = await KnowledgeBaseDocModel.find({ agentId }, { content: 0 }).sort({
        createdAt: -1,
      });
      return docs.map((d) => this.mapDocToDomain(d));
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_LIST_KB_DOCS_ERROR');
    }
  }

  async findDocById(agentId: string, docId: string): Promise<IKnowledgeBaseDoc | null> {
    try {
      const doc = await KnowledgeBaseDocModel.findOne({ agentId, docId });
      return doc ? this.mapDocToDomain(doc) : null;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_FIND_KB_DOC_ERROR');
    }
  }

  async deleteDoc(agentId: string, docId: string): Promise<void> {
    try {
      await KnowledgeBaseDocModel.deleteOne({ agentId, docId });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_DELETE_KB_DOC_ERROR');
    }
  }

  async createJob(job: IIngestionJob): Promise<void> {
    try {
      await IngestionJobModel.create(job as unknown as any);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_SAVE_INGESTION_JOB_ERROR');
    }
  }

  async updateJob(jobId: string, updates: Partial<IIngestionJob>): Promise<void> {
    try {
      await IngestionJobModel.findOneAndUpdate({ jobId }, { $set: updates });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_UPDATE_INGESTION_JOB_ERROR');
    }
  }

  async findJobById(jobId: string, agentId: string): Promise<IIngestionJob | null> {
    try {
      const job = await IngestionJobModel.findOne({ jobId, agentId });
      return job ? this.mapJobToDomain(job) : null;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_FIND_INGESTION_JOB_ERROR');
    }
  }

  async findLatestJobByAgentId(agentId: string): Promise<IIngestionJob | null> {
    try {
      // First, try to find active jobs (pending or processing)
      const activeJob = await IngestionJobModel.findOne({
        agentId,
        status: { $in: [JobStatus.PENDING, JobStatus.PROCESSING] },
      }).sort({ createdAt: -1 });

      if (activeJob) {
        return this.mapJobToDomain(activeJob);
      }

      // If no active job, return null so frontend shows upload UI
      // (don't show completed/failed jobs - they should trigger new upload)
      return null;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'MONGO_FIND_LATEST_INGESTION_JOB_ERROR');
    }
  }
}
