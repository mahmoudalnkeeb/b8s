import { billingRates } from '../../domain/configs/billing-rates';
import { BillingTier } from '../../domain/models';

export const billingConfig = {
  rates: billingRates,
  tiers: {
    none: { monthly: 0, cuAllocation: 0 },
    free: { monthly: 0, cuAllocation: 2 },
    basic: { monthly: 10, cuAllocation: 12 },
    pro: { monthly: 30, cuAllocation: 40 },
  },
} as const;

export type { BillingTier };
