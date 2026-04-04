import { z } from 'zod';
import 'dotenv/config';
import { logger } from '../utils/logger';

const envSchema = z.object({
  PORT: z.string().transform(Number).default(3000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(1),

  // MongoDB
  MONGODB_URI: z.url(),

  // Vector DB
  VECTOR_DB_TYPE: z.enum(['qdrant', 'mongodb']).default('qdrant'),
  VECTOR_DB_URL: z.url(),
  VECTOR_DB_API_KEY: z.string().optional(),

  // Ollama
  OLLAMA_URL: z.url().default('http://localhost:11434'),

  // Redis (for BullMQ)
  REDIS_URL: z.url().default('redis://localhost:6379'),

  // LLM
  GEMINI_API_KEY: z.string().min(1),
  GENAI_MODEL: z.string().min(1),
  DEEPSEEK_API_KEY: z.string().min(1),
  DEEPSEEK_MODEL: z.string().min(1),
  EMBEDDING_MODEL: z.string().default('nomic-embed-text-v2-moe'),

  // SMTP (for password reset emails)
  SMTP_HOST: z.string().default('smtp.example.com'),
  SMTP_PORT: z.string().transform(Number).default(587),
  SMTP_SECURE: z.boolean().default(false),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.email().default('b8s_noreply@mahmoudalnakeeb.com'),

  // Sentry
  SENTRY_DSN: z.string().optional(),
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
