export const aiConfig = {
  vector: {
    dimensionSize: 768, // nomic-embed-text-v2-moe
  },
  rag: {
    defaultTopK: 5,
    chunkSize: 500,
    chunkOverlap: 100,
    batchSize: 1,
    upsertBatchSize: 50,
  },
  memory: {
    defaultTopK: 5,
    scrollLimit: 100,
  },
  agent: {
    maxToolCalls: 5,
  },
};
