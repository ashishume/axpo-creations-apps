import { useQuery } from '@tanstack/react-query';
import { dashboardRepositoryApi, type DashboardStats } from '../lib/db/api/dashboard';

const QUERY_KEY = 'dashboard-stats';

export function useDashboardStats(sessionId: string | null) {
  return useQuery<DashboardStats>({
    queryKey: [QUERY_KEY, sessionId],
    queryFn: () => dashboardRepositoryApi.getStats(sessionId!),
    enabled: !!sessionId,
  });
}
