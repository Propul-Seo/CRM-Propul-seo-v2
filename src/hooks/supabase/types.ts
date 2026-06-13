import type { SupabaseFilters } from '../../types/supabase-types';

export interface UseSupabaseDataOptions {
  table: string;
  select?: string;
  filters?: SupabaseFilters;
  orderBy?: { column: string; ascending?: boolean };
  limit?: number;
}

export interface UseSupabaseDataResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  count: number;
}
