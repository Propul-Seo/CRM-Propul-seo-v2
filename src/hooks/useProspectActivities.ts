import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';
import { ProspectActivity, CreateProspectActivityData, UpdateProspectActivityData } from '@/types/prospect-activity';
import { ProspectActivityService } from '@/services/prospectActivityService';
import { useStore } from '@/store/useStore';

export function useProspectActivities(prospectId: string) {
  const [activities, setActivities] = useState<ProspectActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadActivities = useCallback(async () => {
    if (!prospectId) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await ProspectActivityService.getActivitiesByProspect(prospectId);
      setActivities(data);
    } catch (err) {
      logger.error('Error loading activities:', err);
      setError('Erreur lors du chargement des activités');
    } finally {
      setLoading(false);
    }
  }, [prospectId]);

  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  const refresh = useCallback(() => {
    loadActivities();
  }, [loadActivities]);

  return {
    activities,
    loading,
    error,
    refresh
  };
}

export function useCreateProspectActivity() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useStore();

  const createActivity = useCallback(async (activityData: Omit<CreateProspectActivityData, 'created_by'>) => {
    if (!currentUser) {
      throw new Error('Utilisateur non connecté');
    }

    try {
      setLoading(true);
      setError(null);
      
      const data = await ProspectActivityService.createActivity({
        ...activityData,
        created_by: currentUser.id
      });
      
      // Synchroniser avec le calendrier
      await ProspectActivityService.syncToCalendar(data);
      
      return data;
    } catch (err) {
      logger.error('Error creating activity:', err);
      setError('Erreur lors de la création de l\'activité');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  return {
    createActivity,
    loading,
    error
  };
}

export function useUpdateProspectActivity() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateActivity = useCallback(async (activityId: string, updateData: UpdateProspectActivityData) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await ProspectActivityService.updateActivity(activityId, updateData);
      
      // Synchroniser avec le calendrier si l'activité est mise à jour
      await ProspectActivityService.syncToCalendar(data);
      
      return data;
    } catch (err) {
      logger.error('Error updating activity:', err);
      setError('Erreur lors de la mise à jour de l\'activité');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    updateActivity,
    loading,
    error
  };
}

export function useDeleteProspectActivity() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const deleteActivity = useCallback(async (activityId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await ProspectActivityService.deleteActivity(activityId);
      
      return true;
    } catch (err) {
      logger.error('Error deleting activity:', err);
      setError('Erreur lors de la suppression de l\'activité');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    deleteActivity,
    loading,
    error
  };
}

export function useProspectActivityActions() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const markAsCompleted = useCallback(async (activityId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await ProspectActivityService.markAsCompleted(activityId);
      await ProspectActivityService.syncToCalendar(data);
      
      return data;
    } catch (err) {
      logger.error('Error marking activity as completed:', err);
      setError('Erreur lors de la validation de l\'activité');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const markAsCancelled = useCallback(async (activityId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const data = await ProspectActivityService.markAsCancelled(activityId);
      await ProspectActivityService.syncToCalendar(data);
      
      return data;
    } catch (err) {
      logger.error('Error marking activity as cancelled:', err);
      setError('Erreur lors de l\'annulation de l\'activité');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    markAsCompleted,
    markAsCancelled,
    loading,
    error
  };
} 