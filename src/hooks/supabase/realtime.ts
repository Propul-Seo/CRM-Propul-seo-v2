import { supabase } from '../../lib/supabase';
import { logger } from '@/lib/logger';
import type { RealtimePayload, ContactRow, AccountingEntryRow } from '../../types/supabase-types';

export function setupDataRealtimeChannels(fetchData: () => void) {
  // Souscription realtime pour synchroniser automatiquement les contacts
  // quand une activité est créée/modifiée/supprimée
  const activitiesChannel = supabase
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

  // Souscription realtime pour synchroniser automatiquement les contacts
  const contactsChannel = supabase
    .channel('contacts-sync')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'contacts'
      },
      (payload: RealtimePayload<ContactRow>) => {
        logger.debug('Contact modifié, rechargement automatique:', payload);

        setTimeout(() => {
          logger.debug('Rechargement automatique des contacts...');
          fetchData();
        }, 300);
      }
    )
    .subscribe();

  // Souscription realtime pour synchroniser automatiquement les données comptables
  const accountingChannel = supabase
    .channel('accounting-entries-sync')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'accounting_entries'
      },
      (payload: RealtimePayload<AccountingEntryRow>) => {
        logger.debug('Entrée comptable modifiée, rechargement automatique:', payload);

        setTimeout(() => {
          logger.debug('Rechargement automatique des données comptables...');
          fetchData();
        }, 300);
      }
    )
    .subscribe();

  // Nettoyage des souscriptions
  return () => {
    supabase.removeChannel(activitiesChannel);
    supabase.removeChannel(contactsChannel);
    supabase.removeChannel(accountingChannel);
  };
}
