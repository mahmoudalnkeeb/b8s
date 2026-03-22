import { VercelAiAdapter } from './vercel-ai';

describe('VercelAiAdapter', () => {
  it('should throw error if provider config is missing', () => {
    expect(() => new VercelAiAdapter({ useProvider: 'google' })).toThrow();
  });

  it('should instantiate for ollama', () => {
    const adapter = new VercelAiAdapter({
      useProvider: 'ollama',
      ollamaUrl: 'http://localhost:11434',
    });
    expect(adapter).toBeDefined();
  });
});
