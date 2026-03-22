import { z } from 'zod';
import 'dotenv/config';
import { logger } from '../utils/logger';

const envSchema = z.object({
  PORT: z.string().transform(Number).default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(1),

  // MongoDB
  MONGODB_URI: z.string().url(),

  // Vector DB
  VECTOR_DB_TYPE: z.enum(['qdrant', 'mongodb']).default('qdrant'),
  VECTOR_DB_URL: z.string().url(),
  VECTOR_DB_API_KEY: z.string().optional(),

  // Ollama
  OLLAMA_URL: z.string().url().default('http://localhost:11434'),

  // LLM
  GEMINI_API_KEY: z.string().min(1),
  GENAI_MODEL: z.string().min(1),
  DEEPSEEK_API_KEY: z.string().min(1),
  DEEPSEEK_MODEL: z.string().min(1),
  EMBEDDING_MODEL: z.string().default('nomic-embed-text-v2-moe'),
});

export const validateEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    logger.error('❌ Invalid environment variables:', z.treeifyError(result.error).errors);
    process.exit(1);
  }

  return result.data;
};

export const env = validateEnv();

export type Env = z.infer<typeof envSchema>;
