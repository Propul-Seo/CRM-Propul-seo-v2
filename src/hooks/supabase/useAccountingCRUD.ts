import { useState } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '../useAuth';
import type {
  AccountingEntryInsert,
  AccountingEntryUpdate,
  AccountingEntryRow,
  CRUDResult,
} from '../../types/supabase-types';
import {
  resolveAccountingTable,
  buildAccountingInsertData,
  insertWithFallback,
  getAccountingErrorMessage,
} from './accountingHelpers';

// Hook CRUD pour les entrées comptables
export function useAccountingCRUD() {
  const [loading, setLoading] = useState(false);
  const { user: currentUser } = useAuth();

  const createEntry = async (entryData: Partial<AccountingEntryInsert>): Promise<CRUDResult<AccountingEntryRow>> => {
    setLoading(true);
    try {
      logger.debug('Auth Debug - currentUser:', currentUser);

      if (!currentUser?.id) {
        logger.error('Utilisateur non connecté - currentUser:', currentUser);
        throw new Error('Utilisateur non connecté');
      }

      logger.debug('BYPASS: Utilisation directe de auth.users sans vérification profil');

      const tableName = await resolveAccountingTable();
      logger.debug(`Tentative création entrée comptable dans ${tableName}:`, entryData);

      const finalData = buildAccountingInsertData(tableName, entryData as Record<string, unknown>, currentUser.id);
      const { data, isFallback } = await insertWithFallback(tableName, finalData);

      toast.success(isFallback
        ? `Entrée comptable créée dans ${tableName} (mode bypass)`
        : 'Entrée comptable créée');
      return { success: true, data: data as AccountingEntryRow };
    } catch (error) {
      const err = error as Error & { details?: string; hint?: string; code?: string };
      logger.error('Error creating accounting entry:', err);
      toast.error(getAccountingErrorMessage(err));
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateEntry = async (id: string, updates: AccountingEntryUpdate): Promise<CRUDResult<AccountingEntryRow>> => {
    setLoading(true);
    try {
      const tableName = await resolveAccountingTable();
      const { data, error } = await supabase
        .from(tableName)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast.success('Entrée mise à jour');
      return { success: true, data: data as AccountingEntryRow };
    } catch (error) {
      const err = error as Error;
      logger.error('Error updating entry:', err);
      toast.error('Erreur lors de la mise à jour');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteEntry = async (id: string): Promise<CRUDResult<void>> => {
    setLoading(true);
    try {
      const tableName = await resolveAccountingTable();
      const { error } = await supabase
        .from(tableName)
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Entrée supprimée');
      return { success: true };
    } catch (error) {
      const err = error as Error;
      logger.error('Error deleting entry:', err);
      toast.error('Erreur lors de la suppression');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { createEntry, updateEntry, deleteEntry, loading };
}
