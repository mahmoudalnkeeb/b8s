import { z } from 'zod';
import { BillingTier } from '../../domain/models';

export const redeemCouponDto = z.object({
  code: z.string().min(1).max(20).trim(),
});

export const addCUsDto = z.object({
  amount: z.number().positive(),
  asGranted: z.boolean().optional().default(true),
});

export const createCouponDto = z.object({
  code: z.string().min(1).max(20).trim().optional(),
  tier: z.enum(BillingTier).refine((t) => t !== BillingTier.NONE, { message: 'Invalid tier' }),
  cuGrant: z.number().positive(),
  maxUses: z.number().int().positive(),
  expiresAt: z.date().optional(),
});
