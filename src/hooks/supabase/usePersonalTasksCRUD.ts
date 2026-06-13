import { useState } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import type { PersonalTask, PersonalTaskInsert, PersonalTaskUpdate } from '../../types/personalTasks';
import type { CRUDResult } from '../../types/supabase-types';

export function usePersonalTasksCRUD() {
  const [loading, setLoading] = useState(false);

  const createTask = async (taskData: PersonalTaskInsert): Promise<CRUDResult<PersonalTask>> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('personal_tasks')
        .insert([taskData])
        .select()
        .single();

      if (error) throw error;
      toast.success('Tâche créée');
      return { success: true, data: data as PersonalTask };
    } catch (error) {
      const err = error as Error;
      logger.error('Error creating personal task:', err);
      toast.error('Erreur lors de la création de la tâche');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (id: string, updates: PersonalTaskUpdate): Promise<CRUDResult<PersonalTask>> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('personal_tasks')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data: data as PersonalTask };
    } catch (error) {
      const err = error as Error;
      logger.error('Error updating personal task:', err);
      toast.error('Erreur lors de la mise à jour');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (id: string): Promise<CRUDResult<void>> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('personal_tasks')
        .delete()
        .eq('id', id)
        .select();

      if (error) throw error;
      if (!data || data.length === 0) {
        toast.error('Impossible de supprimer cette tâche');
        return { success: false, error: 'Aucune ligne supprimée' };
      }
      toast.success('Tâche supprimée');
      return { success: true };
    } catch (error) {
      const err = error as Error;
      logger.error('Error deleting personal task:', err);
      toast.error('Erreur lors de la suppression');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { createTask, updateTask, deleteTask, loading };
}
