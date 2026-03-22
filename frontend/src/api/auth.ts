import { useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'

export const authApi = {
  login: async (data: any) => {
    const response = await apiClient.post('/auth/login', data)
    return response.data
  },
  register: async (data: any) => {
    const response = await apiClient.post('/auth/register', data)
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
