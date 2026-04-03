import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'

export interface User {
  userId: string;
  email: string;
  name: string;
  role: string;
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
