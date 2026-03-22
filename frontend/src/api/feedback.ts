import { useMutation } from '@tanstack/react-query';
import { apiClient } from './client';

interface SubmitFeedbackRequest {
  type: 'bug' | 'suggestion';
  content: string;
}

export const useSubmitFeedback = () => {
  return useMutation({
    mutationFn: async (data: SubmitFeedbackRequest) => {
      const response = await apiClient.post('/feedback', data);
      return response.data;
    },
  });
};
