import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { apiClient } from './client'

export interface PaginatedAgentsResponse {
  agents: any[];
  total: number;
  limit: number;
  offset: number;
}

export interface UseMyAgentsParams {
  limit?: number;
  offset?: number;
  search?: string;
}

export const agentsApi = {
  getMyAgents: async (params?: UseMyAgentsParams) => {
    const response = await apiClient.get('/agents/my', { params })
    return response.data as PaginatedAgentsResponse
  },
  getPinnedAgents: async () => {
    const response = await apiClient.get('/agents/pinned')
    return response.data
  },
  getDiscoverAgents: async (search?: string) => {
    const response = await apiClient.get('/agents/discover', {
      params: { search }
    })
    return response.data
  },
  getAgentById: async (id: string) => {
    const response = await apiClient.get(`/agents/${id}`)
    return response.data
  },
  createAgent: async (data: any) => {
    const response = await apiClient.post('/agents', data)
    return response.data
  },
  updateAgent: async ({ id, data }: { id: string; data: any }) => {
    const response = await apiClient.patch(`/agents/${id}`, data)
    return response.data
  },
  deployAgent: async (id: string) => {
    const response = await apiClient.post(`/agents/${id}/deploy`)
    return response.data
  },
  togglePinAgent: async (id: string) => {
    const response = await apiClient.post(`/agents/${id}/pin`)
    return response.data
  },
  deleteAgent: async (id: string) => {
    const response = await apiClient.delete(`/agents/${id}`)
    return response.data
  },
  uploadKb: async ({ id, file }: { id: string; file: File }) => {
    const formData = new FormData()
    formData.append('file', file)
    const response = await apiClient.post(`/agents/${id}/kb`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },
  getKnowledgeBase: async (id: string) => {
    const response = await apiClient.get(`/agents/${id}/kb`)
    return response.data
  },
  deleteKbDoc: async ({ agentId, docId }: { agentId: string; docId: string }) => {
    const response = await apiClient.delete(`/agents/${agentId}/kb/${docId}`)
    return response.data
  },
  getJobStatus: async (agentId: string, jobId: string) => {
    const response = await apiClient.get(`/agents/${agentId}/jobs/${jobId}`)
    return response.data
  },
  getLatestJobStatus: async (agentId: string) => {
    const response = await apiClient.get(`/agents/${agentId}/jobs/latest`)
    return response.data
  },
  getMemories: async (id: string) => {
    const response = await apiClient.get(`/agents/${id}/memories`)
    return response.data
  },
}

export const useMyAgents = (params?: UseMyAgentsParams, options?: { enabled?: boolean }) => {
  return useQuery({
    queryKey: ['agents', 'my', params],
    queryFn: () => agentsApi.getMyAgents(params),
    refetchOnWindowFocus: true,
    ...options,
  })
}

export const useDiscoverAgents = (search?: string) => {
  return useQuery({
    queryKey: ['agents', 'discover', search],
    queryFn: () => agentsApi.getDiscoverAgents(search),
    refetchOnWindowFocus: true,
  })
}

export const usePinnedAgents = (options?: any) => {
  return useQuery({
    queryKey: ['agents', 'pinned'],
    queryFn: agentsApi.getPinnedAgents,
    refetchOnWindowFocus: true,
    ...options,
  })
}

export const useAgent = (id: string) => {
  return useQuery({
    queryKey: ['agents', id],
    queryFn: () => agentsApi.getAgentById(id),
    enabled: !!id,
    refetchOnWindowFocus: true,
  })
}

export const useCreateAgent = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: agentsApi.createAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents', 'my'] })
    },
  })
}

export const useUpdateAgent = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: agentsApi.updateAgent,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agents', variables.id] })
      queryClient.invalidateQueries({ queryKey: ['agents', 'my'] })
    },
  })
}

export const useDeployAgent = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: agentsApi.deployAgent,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['agents', id] })
      queryClient.invalidateQueries({ queryKey: ['agents', 'my'] })
    },
  })
}

export const useTogglePinAgent = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: agentsApi.togglePinAgent,
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ['agents', id] })
      queryClient.invalidateQueries({ queryKey: ['agents', 'my'] })
      queryClient.invalidateQueries({ queryKey: ['agents', 'pinned'] })
    },
  })
}

export const useDeleteAgent = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: agentsApi.deleteAgent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['agents', 'my'] })
      queryClient.invalidateQueries({ queryKey: ['agents', 'pinned'] })
    },
  })
}

export const useUploadKb = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: agentsApi.uploadKb,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agents', variables.id, 'kb'] })
    }
  })
}

export const useKnowledgeBase = (id: string) => {
  return useQuery({
    queryKey: ['agents', id, 'kb'],
    queryFn: () => agentsApi.getKnowledgeBase(id),
    enabled: !!id,
    refetchOnWindowFocus: true,
  })
}

export const useDeleteKbDoc = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: agentsApi.deleteKbDoc,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['agents', variables.agentId, 'kb'] })
    },
  })
}

export const useJobStatus = (agentId: string, jobId: string) => {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: ['jobs', agentId, jobId],
    queryFn: () => agentsApi.getJobStatus(agentId, jobId),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data as any
      if (data?.status === 'completed' || data?.status === 'failed') {
        if (data?.status === 'completed') {
          queryClient.invalidateQueries({ queryKey: ['agents', agentId, 'kb'] })
        }
        return false
      }
      return 2000
    },
  })
}

export const useLatestJobStatus = (agentId: string) => {
  const queryClient = useQueryClient()
  return useQuery({
    queryKey: ['jobs', agentId, 'latest'],
    queryFn: () => agentsApi.getLatestJobStatus(agentId),
    enabled: !!agentId,
    refetchInterval: (query) => {
      const data = query.state.data as any
      if (data?.status === 'completed' || data?.status === 'failed') {
        if (data?.status === 'completed') {
          queryClient.invalidateQueries({ queryKey: ['agents', agentId, 'kb'] })
        }
        return false
      }
      return 2000
    },
  })
}

export const useAgentMemories = (id: string) => {
  return useQuery({
    queryKey: ['agents', id, 'memories'],
    queryFn: () => agentsApi.getMemories(id),
    enabled: !!id,
    refetchOnWindowFocus: true,
  })
}
