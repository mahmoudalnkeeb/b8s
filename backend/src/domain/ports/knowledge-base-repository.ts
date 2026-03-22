import { IKnowledgeBaseDoc, IIngestionJob } from '../models';

export interface IKnowledgeBaseRepository {
  createDoc(doc: IKnowledgeBaseDoc): Promise<void>;
  listDocs(agentId: string): Promise<IKnowledgeBaseDoc[]>;
  findDocById(agentId: string, docId: string): Promise<IKnowledgeBaseDoc | null>;
  deleteDoc(agentId: string, docId: string): Promise<void>;
  createJob(job: IIngestionJob): Promise<void>;
  updateJob(jobId: string, updates: Partial<IIngestionJob>): Promise<void>;
  findJobById(jobId: string, agentId: string): Promise<IIngestionJob | null>;
}
