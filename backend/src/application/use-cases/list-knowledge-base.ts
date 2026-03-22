import { IKnowledgeBaseRepository } from '../../domain/ports';

export class ListKnowledgeBaseUseCase {
  constructor(private kbRepo: IKnowledgeBaseRepository) {}

  async execute(agentId: string) {
    return await this.kbRepo.listDocs(agentId);
  }
}
