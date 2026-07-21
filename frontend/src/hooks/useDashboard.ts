import { useQuery } from '@tanstack/react-query';
import { useDocuments } from './useDocuments';
import { useAlerts } from './useAlerts';
import { statsService, PlatformStats } from '../api/services';

export const useDashboard = () => {
  const { data: documents, isLoading: isLoadingDocs, error: docsError } = useDocuments();
  const { data: alerts, isLoading: isLoadingAlerts, error: alertsError } = useAlerts();
  const { data: stats, isLoading: isLoadingStats, error: statsError } = useQuery<PlatformStats>({
    queryKey: ['platform-stats'],
    queryFn: statsService.getStats,
    refetchInterval: 30000, // refresh every 30s
  });

  return {
    documents,
    alerts,
    stats,
    isLoading: isLoadingDocs || isLoadingAlerts || isLoadingStats,
    error: docsError || alertsError || statsError,
  };
};
