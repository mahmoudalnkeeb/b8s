import { GoogleGenerativeAI } from '@google/generative-ai';
import { IEmbeddingProvider } from '../../../domain/ports/embedding-provider';
import { LLMProviderError } from '../../../domain/errors';

export class GeminiEmbeddingAdapter implements IEmbeddingProvider {
  private ai: GoogleGenerativeAI;

  constructor(apiKey: string) {
    if (!apiKey)
      throw new LLMProviderError('API key required for Gemini Embedding', 'MISSING_API_KEY');
    this.ai = new GoogleGenerativeAI(apiKey);
  }

  async embed(text: string): Promise<number[]> {
    try {
      const model = this.ai.getGenerativeModel({ model: 'text-embedding-004' });
      const result = await model.embedContent(text);
      return result.embedding.values;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      throw new LLMProviderError(message, 'EMBEDDING_ERROR');
    }
  }
}
