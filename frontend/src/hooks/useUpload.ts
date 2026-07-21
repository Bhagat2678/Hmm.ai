import { useMutation, useQueryClient } from '@tanstack/react-query';
import { documentService } from '../api/services';
import { toast } from 'sonner';

export const useUpload = () => {
  const queryClient = useQueryClient();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['documents'] });

  const upload = useMutation({
    mutationFn: (file: File) => documentService.uploadDocument(file),
    onSuccess: () => {
      toast.success('Document uploaded successfully');
      invalidate();
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || 'Failed to upload document');
    },
  });

  const importUrl = useMutation({
    mutationFn: (url: string) => documentService.importUrl(url),
    onSuccess: () => {
      toast.success('URL imported successfully');
      invalidate();
    },
  });

  const clearCompleted = useMutation({
    mutationFn: () => documentService.clearCompleted(),
    onSuccess: () => {
      invalidate();
    },
  });

  const cancelUpload = useMutation({
    mutationFn: (id: string) => documentService.cancelUpload(id),
    onSuccess: () => invalidate(),
  });

  const pauseUpload = useMutation({
    mutationFn: (id: string) => documentService.pauseUpload(id),
    onSuccess: () => invalidate(),
  });

  const resumeUpload = useMutation({
    mutationFn: (id: string) => documentService.resumeUpload(id),
    onSuccess: () => invalidate(),
  });

  const retryUpload = useMutation({
    mutationFn: (id: string) => documentService.retryUpload(id),
    onSuccess: () => invalidate(),
  });

  return {
    uploadDocument: upload.mutate,
    isPending: upload.isPending,
    importUrl: importUrl.mutate,
    clearCompleted: clearCompleted.mutate,
    cancelUpload: cancelUpload.mutate,
    pauseUpload: pauseUpload.mutate,
    resumeUpload: resumeUpload.mutate,
    retryUpload: retryUpload.mutate,
  };
};
