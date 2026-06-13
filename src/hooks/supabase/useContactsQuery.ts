import { useState, useEffect } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import type { ContactRow, RealtimePayload } from '../../types/supabase-types';

// Hook spécialisé pour les contacts/clients
export function useSupabaseContacts() {
  const [data, setData] = useState<ContactRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data: contacts, error: contactsError, count: totalCount } = await supabase
        .from('contacts')
        .select(`
          *,
          assigned_user:users!assigned_to (
            id,
            name,
            email
          )
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (contactsError) {
        logger.error('Error fetching contacts:', contactsError);
        throw contactsError;
      }

      // Transformer les données pour inclure assigned_user_name
      const contactsWithUserNames: ContactRow[] = (contacts || []).map((contact) => ({
        ...contact,
        assigned_user_name: contact.assigned_user?.name || null
      } as ContactRow));

      setData(contactsWithUserNames);
      setCount(totalCount || 0);

      logger.debug('Contacts récupérés depuis table contacts:', {
        total: contacts?.length || 0,
        count: totalCount
      });
    } catch (err) {
      logger.error('Exception fetching contacts:', err);
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      toast.error(`Erreur: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('contacts-activities-sync')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'contact_activities'
        },
        (payload: RealtimePayload<unknown>) => {
          logger.debug('Activité modifiée, rechargement des contacts:', payload);

          setTimeout(() => {
            logger.debug('Rechargement automatique des contacts...');
            fetchData();
          }, 500);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData,
    count
  };
}
