import { Ollama } from 'ollama';
import { env } from '../../loaders/env';
import { logger } from '../../utils/logger';

export interface IEmbeddingProvider {
  embed(text: string, type: 'query' | 'document'): Promise<number[]>;
  embedBatch(texts: string[], type: 'query' | 'document'): Promise<number[][]>;
}

export class OllamaEmbeddingProvider implements IEmbeddingProvider {
  private ollama: Ollama;
  private model: string;

  constructor() {
    this.ollama = new Ollama({ host: env.OLLAMA_URL });
    this.model = env.EMBEDDING_MODEL;
  }

  private getPrefixedText(text: string, type: 'query' | 'document'): string {
    const prefix = type === 'query' ? 'search_query: ' : 'search_document: ';
    return `${prefix}${text}`;
  }

  private async withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
    for (let i = 0; i < retries; i++) {
      try {
        return await fn();
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : String(err);
        if (i === retries - 1) throw err;
        const delay = Math.pow(2, i) * 1000;
        logger.warn(`Ollama request failed, retrying in ${delay}ms...`, { error: message });
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    throw new Error('Retry limit reached');
  }

  async embed(text: string, type: 'query' | 'document'): Promise<number[]> {
    return this.withRetry(async () => {
      const response = await this.ollama.embed({
        model: this.model,
        input: this.getPrefixedText(text, type),
      });
      return response.embeddings[0] || [];
    });
  }

  async embedBatch(texts: string[], type: 'query' | 'document'): Promise<number[][]> {
    const results: number[][] = [];

    // For local MoE models, sequential processing is much more stable than batching.
    // Batching often triggers expert-swapping overhead that hangs the Ollama server.
    for (let i = 0; i < texts.length; i++) {
      const text = texts[i];
      if (text !== undefined) {
        const embedding = await this.embed(text, type);
        results.push(embedding);
      }
    }

    return results;
  }
}
