import { useState, useEffect, useCallback } from 'react';
import { logger } from '@/lib/logger';

// Types d'activités
export type ActivityType = 'call' | 'meeting' | 'email' | 'follow_up' | 'demo' | 'proposal' | 'note' | 'reminder' | 'other';
export type ActivityPriority = 'low' | 'medium' | 'high';
export type ActivityStatus = 'pending' | 'completed' | 'cancelled';

// Interface pour une activité
export interface Activity {
  id: string;
  prospect_id: string;
  prospect_name: string;
  title: string;
  description?: string;
  activity_date: string;
  activity_type: ActivityType;
  priority: ActivityPriority;
  status: ActivityStatus;
  assigned_to?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Interface pour les événements du calendrier
export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end?: string;
  backgroundColor: string;
  borderColor: string;
  extendedProps: {
    activity: Activity;
    type: 'activity' | 'project' | 'other';
  };
}

// Labels français pour les types d'activités
export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  call: '📞 Appel téléphonique',
  meeting: '📅 Rendez-vous',
  email: '📧 Email de suivi',
  follow_up: '🔄 Relance',
  demo: '💻 Démonstration',
  proposal: '📋 Proposition',
  note: '📝 Note/Mémo',
  reminder: '⏰ Rappel',
  other: '📌 Autre'
};

// Couleurs pour les types d'activités
export const ACTIVITY_TYPE_COLORS: Record<ActivityType, string> = {
  call: '#3B82F6',
  meeting: '#10B981',
  email: '#8B5CF6',
  follow_up: '#F59E0B',
  demo: '#6366F1',
  proposal: '#EAB308',
  note: '#6B7280',
  reminder: '#EF4444',
  other: '#64748B'
};

// Utilitaires pour la persistance
const STORAGE_KEY = 'propulseo_activities';

const loadActivitiesFromStorage = (): Activity[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    logger.error('❌ Erreur lors du chargement des activités:', error);
  }
  return [];
};

const saveActivitiesToStorage = (activities: Activity[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
    logger.debug('💾 Activités sauvegardées:', activities.length);
  } catch (error) {
    logger.error('❌ Erreur lors de la sauvegarde:', error);
  }
};

// Convertir une activité en événement de calendrier
const convertActivityToCalendarEvent = (activity: Activity): CalendarEvent => {
  const color = ACTIVITY_TYPE_COLORS[activity.activity_type];
  
  return {
    id: activity.id,
    title: `${activity.prospect_name} - ${activity.title}`,
    start: activity.activity_date,
    backgroundColor: color,
    borderColor: color,
    extendedProps: {
      activity,
      type: 'activity'
    }
  };
};

// Générer un ID unique
const generateId = (): string => {
  return `activity_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Gestionnaire d'événements pour la synchronisation
type ActivityEventListener = (activities: Activity[]) => void;

class ActivityEventManager {
  private listeners: ActivityEventListener[] = [];

  addListener(listener: ActivityEventListener) {
    this.listeners.push(listener);
  }

  removeListener(listener: ActivityEventListener) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  notify(activities: Activity[]) {
    this.listeners.forEach(listener => listener(activities));
  }
}

const eventManager = new ActivityEventManager();

// Hook principal pour les activités
export const useActivities = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Synchroniser les activités avec le calendrier
  const syncActivitiesToCalendar = useCallback((activitiesList: Activity[]) => {
    try {
      const events = activitiesList.map(convertActivityToCalendarEvent);
      setCalendarEvents(events);
      logger.debug('🔄 Synchronisation calendrier:', events.length, 'événements');
    } catch (error) {
      logger.error('❌ Erreur syncActivitiesToCalendar:', error);
    }
  }, []);

  // Charger les activités
  const loadActivities = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const loadedActivities = loadActivitiesFromStorage();
      setActivities(loadedActivities);
      syncActivitiesToCalendar(loadedActivities);
      logger.debug('✅ Activités chargées:', loadedActivities.length);
    } catch (error) {
      setError('Erreur lors du chargement des activités');
      logger.error('❌ Erreur loadActivities:', error);
    } finally {
      setIsLoading(false);
    }
  }, [syncActivitiesToCalendar]);

  // Ajouter une activité avec notification de synchronisation
  const addActivity = useCallback(async (activityData: Omit<Activity, 'id' | 'created_at' | 'updated_at'>) => {
    setIsLoading(true);
    setError(null);
    try {
      const now = new Date().toISOString();
      const newActivity: Activity = {
        ...activityData,
        id: generateId(),
        created_at: now,
        updated_at: now,
      };

      const updatedActivities = [...activities, newActivity];
      
      // Sauvegarder et mettre à jour l'état
      saveActivitiesToStorage(updatedActivities);
      setActivities(updatedActivities);
      syncActivitiesToCalendar(updatedActivities);
      
      // Notifier les autres composants
      eventManager.notify(updatedActivities);
      
      // 🎨 AMÉLIORATION - Déclencher une notification de synchronisation
      window.dispatchEvent(new CustomEvent('activitySynced', {
        detail: {
          activity: newActivity,
          type: 'created',
          message: `🔄 "${newActivity.title}" synchronisée pour ${newActivity.prospect_name}`
        }
      }));
      
      logger.debug('✅ Activité ajoutée et synchronisée:', newActivity);
      return newActivity;
    } catch (error) {
      setError('Erreur lors de l\'ajout de l\'activité');
      logger.error('❌ Erreur addActivity:', error);
      
      // Notification d'erreur
      window.dispatchEvent(new CustomEvent('activitySyncError', {
        detail: {
          message: 'Erreur lors de la synchronisation de l\'activité'
        }
      }));
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [activities, syncActivitiesToCalendar]);

  // Mettre à jour une activité
  const updateActivity = useCallback(async (id: string, updates: Partial<Activity>) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedActivities = activities.map(activity =>
        activity.id === id
          ? { ...activity, ...updates, updated_at: new Date().toISOString() }
          : activity
      );

      saveActivitiesToStorage(updatedActivities);
      setActivities(updatedActivities);
      syncActivitiesToCalendar(updatedActivities);
      
      // Notifier les autres composants
      eventManager.notify(updatedActivities);
      
      logger.debug('✅ Activité mise à jour:', id);
    } catch (error) {
      setError('Erreur lors de la mise à jour');
      logger.error('❌ Erreur updateActivity:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activities, syncActivitiesToCalendar]);

  // Supprimer une activité
  const deleteActivity = useCallback(async (id: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const updatedActivities = activities.filter(activity => activity.id !== id);

      saveActivitiesToStorage(updatedActivities);
      setActivities(updatedActivities);
      syncActivitiesToCalendar(updatedActivities);
      
      // Notifier les autres composants
      eventManager.notify(updatedActivities);
      
      logger.debug('✅ Activité supprimée:', id);
    } catch (error) {
      setError('Erreur lors de la suppression');
      logger.error('❌ Erreur deleteActivity:', error);
    } finally {
      setIsLoading(false);
    }
  }, [activities, syncActivitiesToCalendar]);

  // Marquer une activité comme terminée
  const completeActivity = useCallback(async (id: string) => {
    await updateActivity(id, { status: 'completed' });
  }, [updateActivity]);

  // Obtenir les activités par prospect
  const getActivitiesByProspect = useCallback((prospectId: string) => {
    return activities.filter(activity => activity.prospect_id === prospectId);
  }, [activities]);

  // Obtenir les activités à venir
  const getUpcomingActivities = useCallback(() => {
    const now = new Date();
    return activities
      .filter(activity => 
        activity.status === 'pending' && 
        new Date(activity.activity_date) >= now
      )
      .sort((a, b) => new Date(a.activity_date).getTime() - new Date(b.activity_date).getTime());
  }, [activities]);

  // Obtenir les événements du calendrier
  const getCalendarEvents = useCallback(() => {
    return calendarEvents;
  }, [calendarEvents]);

  // Écouter les changements d'autres composants
  useEffect(() => {
    const handleActivityChange = (updatedActivities: Activity[]) => {
      setActivities(updatedActivities);
      syncActivitiesToCalendar(updatedActivities);
    };

    eventManager.addListener(handleActivityChange);
    return () => eventManager.removeListener(handleActivityChange);
  }, [syncActivitiesToCalendar]);

  // Charger les activités au montage du composant
  useEffect(() => {
    loadActivities();
  }, [loadActivities]);

  return {
    // État
    activities,
    calendarEvents,
    isLoading,
    error,
    
    // Actions
    loadActivities,
    addActivity,
    updateActivity,
    deleteActivity,
    completeActivity,
    
    // Utilitaires
    getActivitiesByProspect,
    getUpcomingActivities,
    getCalendarEvents,
    syncActivitiesToCalendar: () => syncActivitiesToCalendar(activities),
    
    // Constantes
    ACTIVITY_TYPE_LABELS,
    ACTIVITY_TYPE_COLORS,
  };
}; 