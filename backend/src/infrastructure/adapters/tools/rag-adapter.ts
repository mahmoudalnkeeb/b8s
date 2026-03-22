import { RagService as LegacyRagService } from '../../external-services/rag';
import { IRagService, RagQueryRequest, RagQueryResult } from '../../../domain/ports/rag-service';

export class RagServiceAdapter implements IRagService {
  private legacyService: LegacyRagService;

  constructor() {
    this.legacyService = new LegacyRagService();
  }

  async query(request: RagQueryRequest): Promise<{ ok: boolean; context: RagQueryResult[] }> {
    return await this.legacyService.query({
      agentId: request.agentId,
      query: request.query,
    });
  }

  async deleteDocument(agentId: string, docId: string): Promise<void> {
    await this.legacyService.deleteDocument(agentId, docId);
  }
}
