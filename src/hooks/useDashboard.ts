import { useQuery } from '@tanstack/react-query';
import * as db from '@/lib/db';

export function useDashboardStats() {
  return useQuery({
    queryKey: ['dashboard'],
    queryFn: db.getDashboardStats,
  });
}

