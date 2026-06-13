import { useSupabaseData } from './useSupabaseQuery';
import type { SocialConnectionRow } from '@/types/supabase-types';

export function useSupabaseSocialConnections() {
  return useSupabaseData<SocialConnectionRow>({
    table: 'social_connections',
    select: '*',
    orderBy: { column: 'platform', ascending: true },
  });
}
