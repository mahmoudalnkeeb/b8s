export interface RagQueryRequest {
  agentId: string;
  query: string;
}

export interface RagQueryResult {
  docId: string;
  text: string;
  score: number;
  metadata: Record<string, unknown>;
}

export interface IRagService {
  query(request: RagQueryRequest): Promise<{ ok: boolean; context: RagQueryResult[] }>;
  deleteDocument(agentId: string, docId: string): Promise<void>;
}
