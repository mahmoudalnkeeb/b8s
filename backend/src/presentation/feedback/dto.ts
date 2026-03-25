import { z } from 'zod';

export const submitFeedbackDto = z.object({
  type: z.enum(['bug', 'suggestion']),
  content: z.string().min(10).max(1000),
});

export type SubmitFeedbackDto = z.infer<typeof submitFeedbackDto>;
