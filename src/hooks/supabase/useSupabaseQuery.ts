import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import type { ContactRow } from '../../types/supabase-types';
import type { UseSupabaseDataOptions, UseSupabaseDataResult } from './types';
import { setupDataRealtimeChannels } from './realtime';

export function useSupabaseData<T>({
  table,
  select = '*',
  filters = {},
  orderBy,
  limit
}: UseSupabaseDataOptions): UseSupabaseDataResult<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      let query = supabase
        .from(table)
        .select(select, { count: 'exact' });

      // Apply filters
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          query = query.eq(key, value);
        }
      });

      // Apply ordering
      if (orderBy) {
        query = query.order(orderBy.column, { ascending: orderBy.ascending ?? true });
      }

      // Apply limit
      if (limit) {
        query = query.limit(limit);
      }

      const { data: result, error: fetchError, count: totalCount } = await query;

      if (fetchError) {
        logger.error(`Error fetching ${table}:`, fetchError);
        setError(fetchError.message);
        toast.error(`Erreur lors du chargement des données: ${fetchError.message}`);
      } else {
        let processedData = (result || []) as T[];

        // Traitement spécial pour les contacts avec jointure users
        if (table === 'contacts' && select.includes('users!assigned_to')) {
          processedData = processedData.map((contact) => {
            const contactWithUser = contact as ContactRow;
            return {
              ...contact,
              assigned_user_name: contactWithUser.assigned_user?.name || null
            };
          }) as T[];
        }

        setData(processedData);
        setCount(totalCount || 0);
      }
    } catch (err) {
      logger.error(`Exception fetching ${table}:`, err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const cleanup = setupDataRealtimeChannels(fetchData);

    // Nettoyage des souscriptions
    return cleanup;
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    count
  };
}
