import { useState } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useStore } from '../../store/useStore';
import type { TaskInsert, TaskUpdate, TaskRow, CRUDResult } from '../../types/supabase-types';

// Hook CRUD pour les tâches
export function useTasksCRUD() {
  const [loading, setLoading] = useState(false);
  const { currentUser } = useStore();

  const createTask = async (taskData: Partial<TaskInsert>): Promise<CRUDResult<TaskRow>> => {
    setLoading(true);
    try {
      const adaptedData: TaskInsert = {
        title: taskData.title || 'Nouvelle tâche',
        user_id: currentUser?.id || '',
        assigned_to: taskData.assigned_to === 'none' || taskData.assigned_to === '' ? currentUser?.id || '' : taskData.assigned_to || currentUser?.id || '',
        category: taskData.category || 'general',
        status: taskData.status === 'todo' ? 'todo' :
                taskData.status === 'in_progress' ? 'in_progress' :
                taskData.status === 'done' ? 'done' :
                taskData.status || 'todo',
        priority: taskData.priority || 'medium',
        description: taskData.description,
        project_id: taskData.project_id === 'none' || taskData.project_id === '' ? null : taskData.project_id,
        deadline: taskData.deadline ? new Date(taskData.deadline).toISOString() : null
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([adaptedData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Tâche créée avec succès');
      return { success: true, data: data as TaskRow };
    } catch (error) {
      const err = error as Error;
      logger.error('Error creating task:', err);
      toast.error('Erreur lors de la création de la tâche');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateTask = async (id: string, updates: TaskUpdate): Promise<CRUDResult<TaskRow>> => {
    setLoading(true);
    try {
      const adaptedUpdates: TaskUpdate = {
        ...updates,
        ...(updates.status && {
          status: updates.status === 'todo' ? 'todo' :
                  updates.status === 'in_progress' ? 'in_progress' :
                  updates.status === 'done' ? 'done' :
                  updates.status
        })
      };

      const { data, error } = await supabase
        .from('tasks')
        .update(adaptedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast.success('Tâche mise à jour');
      return { success: true, data: data as TaskRow };
    } catch (error) {
      const err = error as Error;
      logger.error('Error updating task:', err);
      toast.error('Erreur lors de la mise à jour');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteTask = async (id: string): Promise<CRUDResult<void>> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Tâche supprimée');
      return { success: true };
    } catch (error) {
      const err = error as Error;
      logger.error('Error deleting task:', err);
      toast.error('Erreur lors de la suppression');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { createTask, updateTask, deleteTask, loading };
}
