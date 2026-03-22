import { z } from 'zod';
import { AccessType, MemoryReadAccess, MemoryWriteAccess } from '../../infrastructure/db/models';

export const createAgentDto = z.object({
  name: z.string().min(2).max(100).trim(),
  description: z.string().max(500).optional(),
  tags: z.array(z.string()).optional(),
  config: z.object({
    instructions: z.string().min(1),
    tools: z.array(z.string()).optional().default([]),
    memoryEnabled: z.boolean().default(true),
    memoryReadAccess: z.nativeEnum(MemoryReadAccess).default(MemoryReadAccess.PRIVATE),
    memoryWriteAccess: z.nativeEnum(MemoryWriteAccess).default(MemoryWriteAccess.PRIVATE),
    ragEnabled: z.boolean().default(true),
  }),
  accessRules: z
    .object({
      type: z.nativeEnum(AccessType).default(AccessType.PRIVATE),
      allowList: z.array(z.string().email()).optional(),
    })
    .default({ type: AccessType.PRIVATE }),
});

export const updateAgentDto = createAgentDto.partial();

export type CreateAgentDto = z.infer<typeof createAgentDto>;
export type UpdateAgentDto = z.infer<typeof updateAgentDto>;
