import { z } from 'zod';

export const redeemCouponDto = z.object({
  code: z.string().min(1).max(20).trim(),
});

export const addCUsDto = z.object({
  amount: z.number().positive(),
  asGranted: z.boolean().optional().default(true),
});

export const createCouponDto = z.object({
  code: z.string().min(1).max(20).trim().optional(),
  tier: z.enum(['free', 'basic', 'pro']),
  cuGrant: z.number().positive(),
  maxUses: z.number().int().positive(),
  expiresAt: z.string().datetime().optional(),
});
