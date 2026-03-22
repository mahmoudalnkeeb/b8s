import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

export interface BillingBalance {
  role: string;
  tier: string;
  cuBalance: number;
  grantedCuBalance: number;
  totalCuUsed: number;
}

export const billingApi = {
  getBalance: async (): Promise<BillingBalance> => {
    const response = await apiClient.get('/billing/balance');
    return response.data;
  },
  redeemCoupon: async (code: string) => {
    const response = await apiClient.post('/billing/redeem-coupon', { code });
    return response.data;
  },
};

export const useBillingBalance = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['billing', 'balance'],
    queryFn: billingApi.getBalance,
    enabled: options?.enabled ?? true,
  });
};

export const useRedeemCoupon = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (code: string) => billingApi.redeemCoupon(code),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['billing', 'balance'] });
    },
  });
};
