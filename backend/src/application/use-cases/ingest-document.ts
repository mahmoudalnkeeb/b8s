import { IVectorStore, IEmbeddingProvider } from '../../domain/ports';
import { IMemory } from '../../domain/models';
import { randomUUID } from 'crypto';

export interface IngestRequest {
  agentId: string;
  content: string;
  metadata: Record<string, unknown>;
}

export class IngestDocumentUseCase {
  constructor(
    private vectorStore: IVectorStore,
    private embeddingProvider: IEmbeddingProvider,
  ) {}

  private chunkText(
    text: string,
    chunkSize = 1000,
    overlap = 200,
  ): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = start + chunkSize;

      if (end < text.length) {
        const lastSpace = text.lastIndexOf(' ', end);
        if (lastSpace > start + chunkSize * 0.5) {
          end = lastSpace;
        }
      }

      chunks.push(text.substring(start, end).trim());
      start = end - overlap;

      if (start < 0) start = 0;
      if (start >= end) start = end;
    }

    return chunks.filter((c) => c.length > 0);
  }

  async execute(request: IngestRequest): Promise<void> {
    const chunks = this.chunkText(request.content);

    for (const chunk of chunks) {
      const vector = await this.embeddingProvider.embed(chunk);
      const memory: IMemory = {
        id: randomUUID(),
        content: chunk,
        metadata: { ...request.metadata, agentId: request.agentId },
        createdAt: new Date(),
        vector,
      };
      await this.vectorStore.upsert(`agent_${request.agentId}`, memory);
    }
  }
}
