import { DomainError, LLMProviderError } from './index';

describe('Domain Errors', () => {
  it('should preserve prototype chain and name for LLMProviderError', () => {
    const error = new LLMProviderError('Gemini failed', 'API_TIMEOUT');
    expect(error).toBeInstanceOf(DomainError);
    expect(error.name).toBe('LLMProviderError');
    expect(error.code).toBe('API_TIMEOUT');
  });
});
