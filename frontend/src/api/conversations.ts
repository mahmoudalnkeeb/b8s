import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient, getApiBaseUrl, getAuthToken } from './client'

export const conversationsApi = {
  getMyConversations: async () => {
    const response = await apiClient.get('/conversations/my')
    return response.data
  },
  getConversationById: async (id: string) => {
    const response = await apiClient.get(`/conversations/${id}`)
    return response.data
  },
  createConversation: async (data: { agentId: string; firstMessage?: string }) => {
    const response = await apiClient.post('/conversations', data)
    return response.data
  },
  deleteConversation: async (id: string) => {
    const response = await apiClient.delete(`/conversations/${id}`)
    return response.data
  },
  streamMessage: async (conversationId: string, content: string) => {
    const token = getAuthToken();
    const baseUrl = getApiBaseUrl();
    return fetch(`${baseUrl}/conversations/${conversationId}/messages`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ content }),
    });
  },
}

export const useMyConversations = (options?: any) => {
  return useQuery({
    queryKey: ['conversations', 'my'],
    queryFn: conversationsApi.getMyConversations,
    ...options,
  })
}

export const useConversation = (id: string) => {
  return useQuery({
    queryKey: ['conversations', id],
    queryFn: () => conversationsApi.getConversationById(id),
    enabled: !!id,
  })
}

export const useCreateConversation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: conversationsApi.createConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', 'my'] })
    },
  })
}

export const useDeleteConversation = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: conversationsApi.deleteConversation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['conversations', 'my'] })
    },
  })
}
