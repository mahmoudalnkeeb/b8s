export const billingRates = {
  inputCacheMiss: 0.336, // per 1M tokens (raw $0.28 + 20%)
  inputCacheHit: 0.0336, // per 1M tokens (raw $0.028 + 20%)
  output: 0.504, // per 1M tokens (raw $0.42 + 20%)
} as const;
