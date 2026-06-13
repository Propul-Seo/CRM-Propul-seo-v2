import { useState } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import type { ChannelInsert, ChannelUpdate, ChannelRow, CRUDResult } from '../../types/supabase-types';

// Hook CRUD pour les canaux de chat
export function useChannelsCRUD() {
  const [loading, setLoading] = useState(false);

  const createChannel = async (channelData: ChannelInsert): Promise<CRUDResult<ChannelRow>> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('channels')
        .insert([channelData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Canal créé avec succès');
      return { success: true, data: data as ChannelRow };
    } catch (error) {
      const err = error as Error;
      logger.error('Error creating channel:', err);
      toast.error('Erreur lors de la création du canal');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateChannel = async (id: string, updates: ChannelUpdate): Promise<CRUDResult<ChannelRow>> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('channels')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast.success('Canal mis à jour');
      return { success: true, data: data as ChannelRow };
    } catch (error) {
      const err = error as Error;
      logger.error('Error updating channel:', err);
      toast.error('Erreur lors de la mise à jour');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteChannel = async (id: string): Promise<CRUDResult<void>> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('channels')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Canal supprimé');
      return { success: true };
    } catch (error) {
      const err = error as Error;
      logger.error('Error deleting channel:', err);
      toast.error('Erreur lors de la suppression');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { createChannel, updateChannel, deleteChannel, loading };
}
