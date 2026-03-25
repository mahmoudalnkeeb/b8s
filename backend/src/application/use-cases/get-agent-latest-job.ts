import { IKnowledgeBaseRepository } from '../../domain/ports';

export class GetAgentLatestJobUseCase {
  constructor(private kbRepo: IKnowledgeBaseRepository) {}

  async execute(agentId: string) {
    return await this.kbRepo.findLatestJobByAgentId(agentId);
  }
}
