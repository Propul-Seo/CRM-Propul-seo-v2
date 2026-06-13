import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';
import type { User } from '@supabase/supabase-js';

// Interface adaptee a la table tasks existante
export interface Task {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to?: string | null;
  project_id?: string | null;
  due_date?: string | null;
  completed_at?: string | null;
  created_at: string;
  updated_at: string;
}

// Interface pour la creation/mise a jour
export interface TaskFormData {
  title: string;
  description?: string;
  priority: 'high' | 'medium' | 'low';
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  assigned_to?: string | null;
  project_id?: string | null;
  due_date?: string | null;
}

export function useTasks() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  // Recuperer l'utilisateur connecte
  useEffect(() => {
    const getUser = async () => {
      try {
        const { data: { user }, error } = await supabase.auth.getUser();
        if (error) throw error;
        setUser(user);
      } catch (err) {
        logger.exception(err as Error, 'useTasks');
        setError('Erreur d\'authentification');
      }
    };
    getUser();
  }, []);

  // Charger les taches
  const loadTasks = async () => {
    if (!user?.id) return;

    setLoading(true);
    setError(null);

    try {
      logger.debug('Chargement des taches...', 'useTasks');

      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      logger.debug('Taches chargees', 'useTasks', { count: data?.length || 0 });
      setTasks(data || []);
    } catch (err) {
      logger.exception(err as Error, 'useTasks');
      setError('Erreur lors du chargement des taches');
    } finally {
      setLoading(false);
    }
  };

  // Creer une tache
  const createTask = async (taskData: TaskFormData): Promise<Task> => {
    if (!user?.id) {
      throw new Error('Utilisateur non connecte');
    }

    setError(null);

    try {
      // Preparer les donnees pour l'insertion
      const insertData = {
        ...taskData,
        user_id: user.id,
        // Convertir "none" en null pour les champs optionnels
        assigned_to: taskData.assigned_to === 'none' ? null : taskData.assigned_to,
        project_id: taskData.project_id === 'none' ? null : taskData.project_id,
        // Formater la date si elle existe
        due_date: taskData.due_date ? new Date(taskData.due_date).toISOString() : null
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([insertData])
        .select()
        .single();

      if (error) throw error;

      logger.info('Tache creee', 'useTasks', { taskId: data.id });

      // Recharger les taches
      await loadTasks();

      return data;
    } catch (err) {
      logger.exception(err as Error, 'useTasks');
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la creation';
      setError(errorMessage);
      throw err;
    }
  };

  // Mettre a jour une tache
  const updateTask = async (taskId: string, updates: Partial<TaskFormData>): Promise<Task> => {
    setError(null);

    try {
      // Preparer les donnees de mise a jour
      const updateData: Record<string, unknown> = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Convertir "none" en null pour les champs optionnels
      if ('assigned_to' in updates) {
        updateData.assigned_to = updates.assigned_to === 'none' ? null : updates.assigned_to;
      }
      if ('project_id' in updates) {
        updateData.project_id = updates.project_id === 'none' ? null : updates.project_id;
      }
      if ('due_date' in updates) {
        updateData.due_date = updates.due_date ? new Date(updates.due_date).toISOString() : null;
      }

      const { data, error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      logger.info('Tache mise a jour', 'useTasks', { taskId });

      await loadTasks();
      return data;
    } catch (err) {
      logger.exception(err as Error, 'useTasks');
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise a jour';
      setError(errorMessage);
      throw err;
    }
  };

  // Supprimer une tache
  const deleteTask = async (taskId: string): Promise<void> => {
    setError(null);

    try {
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId);

      if (error) throw error;

      logger.info('Tache supprimee', 'useTasks', { taskId });

      await loadTasks();
    } catch (err) {
      logger.exception(err as Error, 'useTasks');
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression';
      setError(errorMessage);
      throw err;
    }
  };

  // Marquer une tache comme terminee
  const completeTask = async (taskId: string): Promise<Task> => {
    return updateTask(taskId, {
      status: 'completed'
    });
  };

  // Charger les taches au montage du composant
  useEffect(() => {
    if (user) {
      loadTasks();
    }
  }, [user]);

  return {
    tasks,
    loading,
    error,
    createTask,
    updateTask,
    deleteTask,
    completeTask,
    loadTasks,
    clearError: () => setError(null)
  };
}
