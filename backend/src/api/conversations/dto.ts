import { z } from 'zod';

export const createConversationDto = z.object({
  agentId: z.string().min(1),
  firstMessage: z.string().min(1).optional(),
});

export const sendMessageDto = z.object({
  content: z.string().min(1),
  metadata: z.record(z.string(), z.any()).optional(),
});

export type CreateConversationDto = z.infer<typeof createConversationDto>;
export type SendMessageDto = z.infer<typeof sendMessageDto>;
