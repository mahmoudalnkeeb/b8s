import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

export interface AdminUser {
  userId: string;
  email: string;
  name: string;
  role: string;
  tier: string;
  cuBalance: number;
  grantedCuBalance: number;
  totalCuUsed: number;
}

export interface AdminCoupon {
  code: string;
  tier: string;
  cuGrant: number;
  maxUses: number;
  usedCount: number;
  usedBy: string[];
  expiresAt?: string;
  active: boolean;
  createdAt: string;
}

export interface AdminFeedback {
  feedbackId: string;
  userId: string;
  type: 'bug' | 'suggestion';
  content: string;
  status: 'new' | 'reviewed' | 'resolved';
  createdAt?: string;
}

export const adminApi = {
  listUsers: async (): Promise<AdminUser[]> => {
    const response = await apiClient.get('/admin/users');
    return response.data;
  },
  addCUs: async (userId: string, amount: number, asGranted: boolean = true) => {
    const response = await apiClient.post(`/admin/users/${userId}/add-cus`, { amount, asGranted });
    return response.data;
  },
  listCoupons: async (): Promise<AdminCoupon[]> => {
    const response = await apiClient.get('/admin/coupons');
    return response.data;
  },
  createCoupon: async (data: { code?: string; tier: string; cuGrant: number; maxUses: number; expiresAt?: string }) => {
    const response = await apiClient.post('/admin/coupons', data);
    return response.data;
  },
  deactivateCoupon: async (code: string) => {
    const response = await apiClient.patch(`/admin/coupons/${code}/deactivate`);
    return response.data;
  },
  listFeedback: async (): Promise<AdminFeedback[]> => {
    const response = await apiClient.get('/admin/feedback');
    return response.data;
  },
  updateFeedbackStatus: async (feedbackId: string, status: string) => {
    const response = await apiClient.patch(`/admin/feedback/${feedbackId}`, { status });
    return response.data;
  },
};

export const useAdminUsers = () => {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: adminApi.listUsers,
  });
};

export const useAdminAddCUs = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, amount, asGranted }: { userId: string; amount: number; asGranted?: boolean }) =>
      adminApi.addCUs(userId, amount, asGranted),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'users'] }),
  });
};

export const useAdminCoupons = () => {
  return useQuery({
    queryKey: ['admin', 'coupons'],
    queryFn: adminApi.listCoupons,
  });
};

export const useAdminCreateCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.createCoupon,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'coupons'] }),
  });
};

export const useAdminDeactivateCoupon = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: adminApi.deactivateCoupon,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'coupons'] }),
  });
};

export const useAdminFeedback = () => {
  return useQuery({
    queryKey: ['admin', 'feedback'],
    queryFn: adminApi.listFeedback,
  });
};

export const useAdminUpdateFeedbackStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ feedbackId, status }: { feedbackId: string; status: string }) =>
      adminApi.updateFeedbackStatus(feedbackId, status),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'feedback'] }),
  });
};
