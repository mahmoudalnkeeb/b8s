import { IKnowledgeBaseRepository, IAgentRepository, IRagService } from '../../domain/ports';

export interface DeleteKnowledgeBaseDocRequest {
  agentId: string;
  docId: string;
  ownerId: string;
}

export class DeleteKnowledgeBaseDocUseCase {
  constructor(
    private kbRepo: IKnowledgeBaseRepository,
    private agentRepo: IAgentRepository,
    private ragService: IRagService,
  ) {}

  async execute(request: DeleteKnowledgeBaseDocRequest) {
    const agent = await this.agentRepo.findById(request.agentId);
    if (!agent || agent.ownerId !== request.ownerId)
      throw new Error('Agent not found or unauthorized');

    const doc = await this.kbRepo.findDocById(request.agentId, request.docId);
    if (!doc) throw new Error('Document not found');

    // 1. Delete vectors from Qdrant
    await this.ragService.deleteDocument(request.agentId, request.docId);

    // 2. Delete raw doc from Mongo
    await this.kbRepo.deleteDoc(request.agentId, request.docId);

    return { ok: true };
  }
}
