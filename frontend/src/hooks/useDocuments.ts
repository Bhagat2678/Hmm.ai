import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { documentService } from '../api/services';
import { toast } from 'sonner';

export const useDocuments = () => {
  return useQuery({
    queryKey: ['documents'],
    queryFn: documentService.getDocuments,
    refetchInterval: 10000, // poll every 10s
  });
};

export const useDeleteDocument = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => documentService.deleteDocument(id),
    onSuccess: () => {
      toast.success('Document deleted');
      queryClient.invalidateQueries({ queryKey: ['documents'] });
    },
    onError: () => toast.error('Failed to delete document'),
  });
};

export const useDownloadDocument = () => {
  return useMutation({
    mutationFn: ({ id, filename }: { id: string; filename: string }) => 
      documentService.downloadDocument(id, filename),
    onError: () => toast.error('Failed to download document'),
  });
};
