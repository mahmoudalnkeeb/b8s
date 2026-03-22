import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from './client';

export const toolsApi = {
  getMyTools: async () => {
    const response = await apiClient.get('/tools');
    return response.data;
  },
  getToolById: async (id: string) => {
    const response = await apiClient.get(`/tools/${id}`);
    return response.data;
  },
  createTool: async (data: any) => {
    const response = await apiClient.post('/tools', data);
    return response.data;
  },
  updateTool: async ({ id, data }: { id: string; data: any }) => {
    const response = await apiClient.patch(`/tools/${id}`, data);
    return response.data;
  },
  deleteTool: async (id: string) => {
    const response = await apiClient.delete(`/tools/${id}`);
    return response.data;
  },
};

export const useMyTools = (options?: any) => {
  return useQuery({
    queryKey: ['tools', 'my'],
    queryFn: toolsApi.getMyTools,
    ...options,
  });
};

export const useTool = (id: string) => {
  return useQuery({
    queryKey: ['tools', id],
    queryFn: () => toolsApi.getToolById(id),
    enabled: !!id,
  });
};

export const useCreateTool = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toolsApi.createTool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools', 'my'] });
    },
  });
};

export const useUpdateTool = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toolsApi.updateTool,
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['tools', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['tools', 'my'] });
    },
  });
};

export const useDeleteTool = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: toolsApi.deleteTool,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tools', 'my'] });
    },
  });
};
