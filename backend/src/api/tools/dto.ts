import { z } from 'zod';

export const createToolDto = z.object({
  name: z.string().min(2).max(100).trim(),
  description: z.string().min(2).max(500),
  url: z.string().url(),
  method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']),
  headers: z.record(z.string(), z.string()).optional(),
  apiSchema: z.record(z.string(), z.any()).optional(),
});

export const updateToolDto = createToolDto.partial();

export type CreateToolDto = z.infer<typeof createToolDto>;
export type UpdateToolDto = z.infer<typeof updateToolDto>;
