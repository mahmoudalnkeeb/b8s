export const billingConfig = {
  rates: {
    inputCacheMiss: 0.336, // per 1M tokens (raw $0.28 + 20%)
    inputCacheHit: 0.0336, // per 1M tokens (raw $0.028 + 20%)
    output: 0.504, // per 1M tokens (raw $0.42 + 20%)
  },
  tiers: {
    none: { monthly: 0, cuAllocation: 0 },
    free: { monthly: 0, cuAllocation: 2 },
    basic: { monthly: 10, cuAllocation: 12 },
    pro: { monthly: 30, cuAllocation: 40 },
  },
} as const;

export type BillingTier = keyof typeof billingConfig.tiers;
