import { useState } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import type { MessageInsert, MessageUpdate, MessageRow, CRUDResult } from '../../types/supabase-types';

// Hook CRUD pour les messages
export function useMessagesCRUD() {
  const [loading, setLoading] = useState(false);

  const sendMessage = async (messageData: MessageInsert): Promise<CRUDResult<MessageRow>> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert([messageData])
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: data as MessageRow };
    } catch (error) {
      const err = error as Error;
      logger.error('Error sending message:', err);
      toast.error("Erreur lors de l'envoi du message");
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateMessage = async (id: string, updates: MessageUpdate): Promise<CRUDResult<MessageRow>> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return { success: true, data: data as MessageRow };
    } catch (error) {
      const err = error as Error;
      logger.error('Error updating message:', err);
      toast.error('Erreur lors de la mise à jour');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (id: string): Promise<CRUDResult<void>> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('messages')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error) {
      const err = error as Error;
      logger.error('Error deleting message:', err);
      toast.error('Erreur lors de la suppression');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { sendMessage, updateMessage, deleteMessage, loading };
}
