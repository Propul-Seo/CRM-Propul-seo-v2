export type { KPIMonthlyOverview, KPIDailyMetrics, KPITopPost } from '@/types/supabase-types';

export type PeriodFilter = '7d' | '30d' | '90d' | '12m';
export type PlatformFilter = 'all' | 'linkedin' | 'instagram' | 'newsletter' | 'multi';
export type TypeFilter = 'all' | 'agence' | 'perso' | 'client' | 'informatif';

export interface KPIFiltersState {
  period: PeriodFilter;
  platform: PlatformFilter;
  type: TypeFilter;
  responsibleUserId: string | null;
}
