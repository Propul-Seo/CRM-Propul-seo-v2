import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { logger } from '@/lib/logger';

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: string;
  budget?: number;
  progress?: number;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
}

export function useProjects() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadProjects = async () => {
    setLoading(true);
    setError(null);

    try {
      logger.debug('Chargement des projets...', 'useProjects');

      const { data, error: fetchError } = await supabase
        .from('projects')
        .select('id, name, description, status, budget, progress, start_date, end_date, created_at, updated_at')
        .order('name', { ascending: true });

      if (fetchError) {
        logger.error('Erreur recuperation projets', 'useProjects', { code: fetchError.code });
        throw new Error('Impossible de recuperer la liste des projets');
      }

      logger.debug('Projets charges', 'useProjects', { count: data?.length || 0 });
      setProjects(data || []);
    } catch (err) {
      logger.exception(err as Error, 'useProjects');
      setError('Erreur lors du chargement des projets');
      setProjects([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProjects();
  }, []);

  return {
    projects,
    loading,
    error,
    loadProjects,
    clearError: () => setError(null)
  };
}
