import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'

export interface User {
  userId: string;
  email: string;
  name: string;
  role: string;
}

export interface ApiKey {
  keyId: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt?: string;
}

export const authApi = {
  login: async (data: any) => {
    const response = await apiClient.post('/auth/login', data)
    return response.data
  },
  register: async (data: any) => {
    const response = await apiClient.post('/auth/register', data)
    return response.data
  },
  getMe: async (): Promise<User> => {
    const response = await apiClient.get('/auth/me')
    return response.data
  },
  forgotPassword: async (email: string) => {
    const response = await apiClient.post('/auth/forgot-password', { email })
    return response.data
  },
  resetPassword: async (token: string, newPassword: string) => {
    const response = await apiClient.post('/auth/reset-password', { token, newPassword })
    return response.data
  },
  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await apiClient.post('/auth/change-password', { currentPassword, newPassword })
    return response.data
  },
  getApiKeys: async (): Promise<ApiKey[]> => {
    const response = await apiClient.get('/api-keys')
    return response.data
  },
  createApiKey: async (name: string): Promise<{ keyId: string; key: string; name: string; keyPrefix: string; createdAt: string }> => {
    const response = await apiClient.post('/api-keys', { name })
    return response.data
  },
  revokeApiKey: async (keyId: string) => {
    const response = await apiClient.delete(`/api-keys/${keyId}`)
    return response.data
  },
}

export const useLogin = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: authApi.login,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
    },
  })
}

export const useRegister = () => {
  return useMutation({
    mutationFn: authApi.register,
  })
}

export const useMe = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['me'],
    queryFn: authApi.getMe,
    enabled: options?.enabled ?? true,
  })
}

export const useForgotPassword = () => {
  return useMutation({
    mutationFn: authApi.forgotPassword,
  })
}

export const useResetPassword = () => {
  return useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      authApi.resetPassword(token, newPassword),
  })
}

export const useChangePassword = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ currentPassword, newPassword }: { currentPassword: string; newPassword: string }) =>
      authApi.changePassword(currentPassword, newPassword),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['me'] })
    },
  })
}

export const useApiKeys = (options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['api-keys'],
    queryFn: authApi.getApiKeys,
    enabled: options?.enabled ?? true,
  })
}

export const useCreateApiKey = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: authApi.createApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
    },
  })
}

export const useRevokeApiKey = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: authApi.revokeApiKey,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['api-keys'] })
    },
  })
}
