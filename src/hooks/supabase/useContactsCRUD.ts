import { useState } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useStore } from '../../store/useStore';
import type { ContactInsert, ContactUpdate, ContactRow, CRUDResult } from '../../types/supabase-types';
import { adaptContactForInsert, adaptContactForUpdate } from './contactHelpers';

// Hook CRUD pour les contacts/leads
export function useContactsCRUD() {
  const [loading, setLoading] = useState(false);
  const { currentUser } = useStore();

  const createContact = async (contactData: Partial<ContactInsert>): Promise<CRUDResult<ContactRow>> => {
    setLoading(true);
    try {
      if (!currentUser?.id) {
        throw new Error('Utilisateur non connecté');
      }

      const adaptedData = adaptContactForInsert(contactData, currentUser.id);

      const { data, error } = await supabase
        .from('contacts')
        .insert([adaptedData])
        .select()
        .single();

      if (error) {
        throw error;
      }

      toast.success('Contact créé avec succès');
      return { success: true, data: data as ContactRow };
    } catch (error) {
      const err = error as Error;
      logger.error('Error creating contact:', err);
      toast.error(`Erreur lors de la création du contact: ${err.message}`);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateContact = async (id: string, updates: ContactUpdate): Promise<CRUDResult<ContactRow>> => {
    setLoading(true);
    try {
      logger.debug('updateContact appelé avec:', { id, updates });

      const adaptedUpdates = adaptContactForUpdate(updates);
      logger.debug('adaptedUpdates:', adaptedUpdates);

      const { data, error } = await supabase
        .from('contacts')
        .update(adaptedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        logger.error('Erreur Supabase:', error);
        throw error;
      }

      logger.debug('Contact mis à jour avec succès:', data);
      toast.success('Contact mis à jour');
      return { success: true, data: data as ContactRow };
    } catch (error) {
      const err = error as Error & { details?: string; hint?: string; code?: string };
      logger.error('Error updating contact:', err);
      logger.error('Error details:', {
        message: err.message,
        details: err.details,
        hint: err.hint,
        code: err.code
      });
      toast.error(`Erreur lors de la mise à jour: ${err.message}`);
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteContact = async (id: string): Promise<CRUDResult<void>> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('contacts')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Contact supprimé');
      return { success: true };
    } catch (error) {
      const err = error as Error;
      logger.error('Error deleting contact:', err);
      toast.error('Erreur lors de la suppression');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { createContact, updateContact, deleteContact, loading };
}
