import { DIContainer } from './container';

describe('DIContainer', () => {
  it('should instantiate all dependencies', () => {
    expect(DIContainer.chatWithAgent).toBeDefined();
    expect(DIContainer.createAgent).toBeDefined();
    expect(DIContainer.ingestDocument).toBeDefined();
  });
});
