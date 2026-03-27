export interface RagQueryRequest {
  agentId: string;
  query: string;
}

export interface RagCitation {
  fileName: string;
  chunkIndex: number;
  totalChunks?: number;
  docId: string;
}

export interface RagQueryResult {
  docId: string;
  text: string;
  score: number;
  metadata: Record<string, unknown>;
  citation: RagCitation;
}

export interface IRagService {
  query(request: RagQueryRequest): Promise<{ ok: boolean; context: RagQueryResult[] }>;
  deleteDocument(agentId: string, docId: string): Promise<void>;
}
