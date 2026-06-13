import { useSupabaseData } from './useSupabaseQuery';
import type { PostMetricsRow, KPIMonthlyOverview, KPIDailyMetrics, KPITopPost } from '@/types/supabase-types';

export function useSupabasePostMetrics(postId?: string) {
  return useSupabaseData<PostMetricsRow>({
    table: 'post_metrics',
    select: '*',
    filters: postId ? { post_id: postId } : undefined,
    orderBy: { column: 'created_at', ascending: false },
  });
}

export function useKPIMonthlyOverview() {
  return useSupabaseData<KPIMonthlyOverview>({
    table: 'kpi_monthly_overview',
    select: '*',
    orderBy: { column: 'month', ascending: false },
  });
}

export function useKPIDailyMetrics() {
  return useSupabaseData<KPIDailyMetrics>({
    table: 'kpi_daily_metrics',
    select: '*',
    orderBy: { column: 'day', ascending: false },
  });
}

export function useKPITopPosts() {
  return useSupabaseData<KPITopPost>({
    table: 'kpi_top_posts',
    select: '*',
    orderBy: { column: 'performance_score', ascending: false },
    limit: 10,
  });
}
