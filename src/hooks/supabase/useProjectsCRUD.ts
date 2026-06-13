import { useState } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useStore } from '../../store/useStore';
import type { ProjectInsert, ProjectUpdate, ProjectRow, CRUDResult } from '../../types/supabase-types';

// Hook CRUD pour les projets
export function useProjectsCRUD() {
  const [loading, setLoading] = useState(false);
  const { currentUser } = useStore();

  const createProject = async (projectData: Partial<ProjectInsert>): Promise<CRUDResult<ProjectRow>> => {
    setLoading(true);
    try {
      const adaptedData: Partial<ProjectInsert> = {
        ...projectData,
        name: projectData.name || 'Nouveau Projet',
        description: projectData.description || '',
        status: projectData.status === 'paused' ? 'on_hold' : (projectData.status || 'planning')
      };

      const { data, error } = await supabase
        .from('projects')
        .insert([adaptedData])
        .select()
        .single();

      if (error) throw error;
      toast.success('Projet créé avec succès');
      return { success: true, data: data as ProjectRow };
    } catch (error) {
      const err = error as Error;
      logger.error('Error creating project:', err);
      toast.error('Erreur lors de la création du projet');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateProject = async (id: string, updates: ProjectUpdate & { status?: string }): Promise<CRUDResult<ProjectRow>> => {
    setLoading(true);
    try {
      const adaptedUpdates: ProjectUpdate = {
        ...updates,
        ...(updates.status && {
          status: updates.status === 'paused' ? 'on_hold' :
                  updates.status === 'active' ? 'in_progress' :
                  updates.status as ProjectUpdate['status']
        })
      };

      const { data, error } = await supabase
        .from('projects')
        .update(adaptedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast.success('Projet mis à jour');
      return { success: true, data: data as ProjectRow };
    } catch (error) {
      const err = error as Error;
      logger.error('Error updating project:', err);
      toast.error('Erreur lors de la mise à jour');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = async (id: string): Promise<CRUDResult<void>> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Projet supprimé');
      return { success: true };
    } catch (error) {
      const err = error as Error;
      logger.error('Error deleting project:', err);
      toast.error('Erreur lors de la suppression');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { createProject, updateProject, deleteProject, loading };
}
