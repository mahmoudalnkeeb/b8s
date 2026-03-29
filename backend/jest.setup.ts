// Set test environment variables before any module imports
process.env.NODE_ENV = 'test';
process.env.PORT = '3000';
process.env.JWT_SECRET = 'test-secret-key';
process.env.MONGODB_URI = 'mongodb://localhost:27017/b8s-test';
process.env.VECTOR_DB_URL = 'http://localhost:6333';
process.env.OLLAMA_URL = 'http://localhost:11434';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.GEMINI_API_KEY = 'test-gemini-key';
process.env.GENAI_MODEL = 'gemini-2.5-flash';
process.env.DEEPSEEK_API_KEY = 'test-deepseek-key';
process.env.DEEPSEEK_MODEL = 'deepseek-chat';
process.env.EMBEDDING_MODEL = 'nomic-embed-text-v2-moe';
process.env.SENTRY_DSN = '';

// Mock Sentry
jest.mock('@sentry/node', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setupExpressErrorHandler: jest.fn(),
}));

// Mock ioredis
jest.mock('ioredis', () => {
  const onHandlers: Record<string, Function> = {};
  return {
    Redis: jest.fn().mockImplementation(() => ({
      on: jest.fn((event: string, handler: Function) => {
        onHandlers[event] = handler;
      }),
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      quit: jest.fn().mockResolvedValue('OK'),
      disconnect: jest.fn().mockResolvedValue(undefined),
    })),
  };
});

// Mock bullmq
jest.mock('bullmq', () => {
  const mockQueue = jest.fn().mockImplementation(() => ({
    add: jest.fn().mockResolvedValue({ id: 'mock-job-id' }),
    getJob: jest.fn(),
    getWaitingCount: jest.fn().mockResolvedValue(0),
    getActiveCount: jest.fn().mockResolvedValue(0),
    getCompletedCount: jest.fn().mockResolvedValue(0),
    getFailedCount: jest.fn().mockResolvedValue(0),
    getDelayedCount: jest.fn().mockResolvedValue(0),
    pause: jest.fn(),
    resume: jest.fn(),
    clean: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  }));

  const mockWorker = jest.fn().mockImplementation(() => ({
    on: jest.fn(),
    close: jest.fn().mockResolvedValue(undefined),
  }));

  return {
    Queue: mockQueue,
    Worker: mockWorker,
    Job: jest.fn(),
  };
});

// Mock @qdrant/js-client-rest
jest.mock('@qdrant/js-client-rest', () => ({
  QdrantClient: jest.fn().mockImplementation(() => ({
    getCollections: jest.fn().mockResolvedValue({ collections: [] }),
    createCollection: jest.fn().mockResolvedValue(true),
    deleteCollection: jest.fn().mockResolvedValue(true),
    upsert: jest.fn().mockResolvedValue({ operation_id: 0, status: 'completed' }),
    search: jest.fn().mockResolvedValue([]),
    delete: jest.fn().mockResolvedValue({ operation_id: 0, status: 'completed' }),
    getCollection: jest.fn().mockResolvedValue({ vectors_count: 0 }),
  })),
}));

// Mock mongoose
jest.mock('mongoose', () => {
  const actual = jest.requireActual('mongoose');
  return {
    ...actual,
    connect: jest.fn().mockResolvedValue({}),
    connection: {
      ...actual.connection,
      close: jest.fn().mockResolvedValue(undefined),
      readyState: 1,
    },
  };
});
