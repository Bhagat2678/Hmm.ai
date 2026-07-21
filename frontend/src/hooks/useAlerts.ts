import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { alertService } from '../api/services';
import { toast } from 'sonner';

export const useAlerts = () => {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['alerts'],
    queryFn: alertService.getAlerts,
    refetchInterval: 10000, // poll every 10s
  });

  const acknowledgeMutation = useMutation({
    mutationFn: (id: string) => alertService.acknowledgeAlert(id),
    onSuccess: () => {
      toast.success('Alert acknowledged');
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || 'Failed to acknowledge alert');
    },
  });

  const escalateMutation = useMutation({
    mutationFn: (id: string) => alertService.escalateAlert(id),
    onSuccess: () => {
      toast.success('Alert escalated');
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error?.message || 'Failed to escalate alert');
    },
  });

  return {
    ...query,
    acknowledge: acknowledgeMutation.mutate,
    isAcknowledging: acknowledgeMutation.isPending,
    escalate: escalateMutation.mutate,
    isEscalating: escalateMutation.isPending,
  };
};
