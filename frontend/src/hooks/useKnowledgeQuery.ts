import { useMutation } from '@tanstack/react-query';
import { queryService } from '../api/services';
import { QueryRequest, QueryResponse } from '../types/models';
import { toast } from 'sonner';

export const useKnowledgeQuery = () => {
  return useMutation({
    mutationFn: (request: QueryRequest) => queryService.submitQuery(request),
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || 'Failed to execute query');
    },
  });
};
