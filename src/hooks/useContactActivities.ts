import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useStore } from '../store/useStore';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface ContactActivity {
  id: string;
  contact_id: string;
  user_id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task';
  title: string;
  description?: string;
  activity_date: string;
  duration_minutes?: number;
  status: 'scheduled' | 'completed' | 'cancelled';
  outcome?: string;
  follow_up_required?: boolean;
  next_action?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateActivityData {
  contact_id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task';
  title: string;
  description?: string;
  activity_date: string;
  duration_minutes?: number;
  status?: 'scheduled' | 'completed' | 'cancelled';
  outcome?: string;
  follow_up_required?: boolean;
  next_action?: string;
}

export function useContactActivities(contactId: string) {
  const [activities, setActivities] = useState<ContactActivity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useStore();

  // Recuperer toutes les activites d'un contact
  const fetchActivities = async () => {
    if (!contactId || !currentUser?.id) {
      setError('Contact ID ou utilisateur manquant');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Recuperer l'utilisateur depuis la table users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', currentUser.id)
        .single();

      if (userError || !userData) {
        setError('Profil utilisateur non trouve');
        return;
      }

      // Recuperer les activites du contact
      const { data: activitiesData, error: activitiesError } = await supabase
        .from('contact_activities')
        .select('*')
        .eq('contact_id', contactId)
        .order('activity_date', { ascending: false });

      if (activitiesError) {
        logger.error('Erreur recuperation activites', 'useContactActivities', { contactId, code: activitiesError.code });
        setError('Erreur lors de la recuperation des activites');
        return;
      }

      logger.debug('Activites chargees', 'useContactActivities', { contactId, count: activitiesData?.length || 0 });
      setActivities(activitiesData || []);
    } catch (err) {
      logger.exception(err as Error, 'useContactActivities');
      setError('Erreur lors de la recuperation des activites');
    } finally {
      setLoading(false);
    }
  };

  // Creer une nouvelle activite
  const createActivity = async (activityData: CreateActivityData) => {
    if (!currentUser?.id) {
      toast.error('Utilisateur non connecte');
      return { success: false, error: 'Utilisateur non connecte' };
    }

    setLoading(true);

    try {
      // Recuperer l'utilisateur depuis la table users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', currentUser.id)
        .single();

      if (userError || !userData) {
        toast.error('Profil utilisateur non trouve');
        return { success: false, error: 'Profil utilisateur non trouve' };
      }

      // Preparer les donnees de l'activite
      const activityToCreate = {
        ...activityData,
        user_id: userData.id,
        status: activityData.status || 'scheduled',
        follow_up_required: activityData.follow_up_required || false
      };

      const { data: newActivity, error: createError } = await supabase
        .from('contact_activities')
        .insert([activityToCreate])
        .select()
        .single();

      if (createError) {
        logger.error('Erreur creation activite', 'useContactActivities', { code: createError.code });
        toast.error(`Erreur lors de la creation de l'activite: ${createError.message}`);
        return { success: false, error: createError.message };
      }

      // Ajouter la nouvelle activite a la liste
      setActivities(prev => [newActivity, ...prev]);
      toast.success('Activite creee avec succes');
      logger.info('Activite creee', 'useContactActivities', { activityId: newActivity.id, contactId });
      return { success: true, data: newActivity };

    } catch (err) {
      const error = err as Error;
      logger.exception(error, 'useContactActivities');
      toast.error(`Erreur lors de la creation de l'activite: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Mettre a jour une activite
  const updateActivity = async (activityId: string, updates: Partial<CreateActivityData>) => {
    setLoading(true);

    try {
      const { data: updatedActivity, error: updateError } = await supabase
        .from('contact_activities')
        .update({
          ...updates,
          updated_at: new Date().toISOString()
        })
        .eq('id', activityId)
        .select()
        .single();

      if (updateError) {
        logger.error('Erreur mise a jour activite', 'useContactActivities', { activityId, code: updateError.code });
        toast.error(`Erreur lors de la mise a jour de l'activite: ${updateError.message}`);
        return { success: false, error: updateError.message };
      }

      // Mettre a jour l'activite dans la liste
      setActivities(prev =>
        prev.map(activity =>
          activity.id === activityId ? updatedActivity : activity
        )
      );

      toast.success('Activite mise a jour avec succes');
      logger.info('Activite mise a jour', 'useContactActivities', { activityId });
      return { success: true, data: updatedActivity };

    } catch (err) {
      const error = err as Error;
      logger.exception(error, 'useContactActivities');
      toast.error(`Erreur lors de la mise a jour de l'activite: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Supprimer une activite
  const deleteActivity = async (activityId: string) => {
    setLoading(true);

    try {
      const { error: deleteError } = await supabase
        .from('contact_activities')
        .delete()
        .eq('id', activityId);

      if (deleteError) {
        logger.error('Erreur suppression activite', 'useContactActivities', { activityId, code: deleteError.code });
        toast.error(`Erreur lors de la suppression de l'activite: ${deleteError.message}`);
        return { success: false, error: deleteError.message };
      }

      // Retirer l'activite de la liste
      setActivities(prev => prev.filter(activity => activity.id !== activityId));
      toast.success('Activite supprimee avec succes');
      logger.info('Activite supprimee', 'useContactActivities', { activityId });
      return { success: true };

    } catch (err) {
      const error = err as Error;
      logger.exception(error, 'useContactActivities');
      toast.error(`Erreur lors de la suppression de l'activite: ${error.message}`);
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  // Marquer une activite comme terminee
  const markActivityCompleted = async (activityId: string, outcome?: string) => {
    return await updateActivity(activityId, {
      status: 'completed',
      outcome
    });
  };

  // Charger les activites au montage du composant
  useEffect(() => {
    if (contactId && currentUser?.id) {
      fetchActivities();
    }
  }, [contactId, currentUser?.id]);

  return {
    activities,
    loading,
    error,
    fetchActivities,
    createActivity,
    updateActivity,
    deleteActivity,
    markActivityCompleted
  };
}
