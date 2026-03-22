import { Ollama } from 'ollama';
import { IEmbeddingProvider } from '../../../domain/ports/embedding-provider';
import { DatabaseError } from '../../../domain/errors';
import { env } from '@/infrastructure/loaders/env';

export class OllamaEmbeddingAdapter implements IEmbeddingProvider {
  private ollama: Ollama;

  constructor(host: string = 'http://localhost:11434') {
    this.ollama = new Ollama({ host });
  }

  async embed(text: string): Promise<number[]> {
    try {
      const response = await this.ollama.embeddings({
        model: env.EMBEDDING_MODEL,
        prompt: text,
      });
      return response.embedding;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new DatabaseError(message, 'EMBEDDING_ERROR');
    }
  }
}
