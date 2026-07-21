import { useQuery } from '@tanstack/react-query';
import { graphService } from '../api/services';

export const useKnowledgeGraph = (entityId?: string, depth: number = 1, enabled: boolean = true) => {
  return useQuery({
    queryKey: ['graph', entityId || '', depth],
    queryFn: () => graphService.getNeighborhood(entityId, depth),
    enabled: enabled,
  });
};
