import { IKnowledgeBaseRepository } from '../../domain/ports';

export class GetIngestionJobStatusUseCase {
  constructor(private kbRepo: IKnowledgeBaseRepository) {}

  async execute(jobId: string, agentId: string) {
    return await this.kbRepo.findJobById(jobId, agentId);
  }
}
