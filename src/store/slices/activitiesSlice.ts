import { StateCreator } from 'zustand';

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

// Interface du store des activités
export interface ActivitiesSlice {
  activities: Activity[];
  calendarEvents: CalendarEvent[];
  isLoading: boolean;
  error: string | null;
  
  // Actions pour les activités
  loadActivities: () => Promise<void>;
  addActivity: (activity: Omit<Activity, 'id' | 'created_at' | 'updated_at'>) => Promise<Activity>;
  updateActivity: (id: string, updates: Partial<Activity>) => Promise<void>;
  deleteActivity: (id: string) => Promise<void>;
  completeActivity: (id: string) => Promise<void>;
  
  // Actions pour la synchronisation
  syncActivitiesToCalendar: () => void;
  getActivitiesByProspect: (prospectId: string) => Activity[];
  getUpcomingActivities: () => Activity[];
  
  // Actions pour le calendrier
  getCalendarEvents: () => CalendarEvent[];
  refreshCalendar: () => Promise<void>;
}

// Utilitaires pour la persistance
const STORAGE_KEY = 'propulseo_activities';

const loadActivitiesFromStorage = (): Activity[] => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('❌ Erreur lors du chargement des activités:', error);
  }
  return [];
};

const saveActivitiesToStorage = (activities: Activity[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(activities));
    console.log('💾 Activités sauvegardées:', activities.length);
  } catch (error) {
    console.error('❌ Erreur lors de la sauvegarde:', error);
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

// Créer le slice des activités
export const createActivitiesSlice: StateCreator<ActivitiesSlice> = (set, get) => ({
  activities: [],
  calendarEvents: [],
  isLoading: false,
  error: null,

  loadActivities: async () => {
    set({ isLoading: true, error: null });
    try {
      const activities = loadActivitiesFromStorage();
      set({ activities, isLoading: false });
      
      // Synchroniser avec le calendrier
      get().syncActivitiesToCalendar();
      
      console.log('✅ Activités chargées:', activities.length);
    } catch (error) {
      set({ error: 'Erreur lors du chargement des activités', isLoading: false });
      console.error('❌ Erreur loadActivities:', error);
    }
  },

  addActivity: async (activityData) => {
    set({ isLoading: true, error: null });
    try {
      const now = new Date().toISOString();
      const newActivity: Activity = {
        ...activityData,
        id: generateId(),
        created_at: now,
        updated_at: now,
      };

      const currentActivities = get().activities;
      const updatedActivities = [...currentActivities, newActivity];
      
      // Sauvegarder et mettre à jour l'état
      saveActivitiesToStorage(updatedActivities);
      set({ activities: updatedActivities, isLoading: false });
      
      // Synchroniser avec le calendrier
      get().syncActivitiesToCalendar();
      
      console.log('✅ Activité ajoutée:', newActivity);
      return newActivity;
    } catch (error) {
      set({ error: 'Erreur lors de l\'ajout de l\'activité', isLoading: false });
      console.error('❌ Erreur addActivity:', error);
      throw error;
    }
  },

  updateActivity: async (id, updates) => {
    set({ isLoading: true, error: null });
    try {
      const currentActivities = get().activities;
      const updatedActivities = currentActivities.map(activity =>
        activity.id === id
          ? { ...activity, ...updates, updated_at: new Date().toISOString() }
          : activity
      );

      saveActivitiesToStorage(updatedActivities);
      set({ activities: updatedActivities, isLoading: false });
      
      // Synchroniser avec le calendrier
      get().syncActivitiesToCalendar();
      
      console.log('✅ Activité mise à jour:', id);
    } catch (error) {
      set({ error: 'Erreur lors de la mise à jour', isLoading: false });
      console.error('❌ Erreur updateActivity:', error);
    }
  },

  deleteActivity: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const currentActivities = get().activities;
      const updatedActivities = currentActivities.filter(activity => activity.id !== id);

      saveActivitiesToStorage(updatedActivities);
      set({ activities: updatedActivities, isLoading: false });
      
      // Synchroniser avec le calendrier
      get().syncActivitiesToCalendar();
      
      console.log('✅ Activité supprimée:', id);
    } catch (error) {
      set({ error: 'Erreur lors de la suppression', isLoading: false });
      console.error('❌ Erreur deleteActivity:', error);
    }
  },

  completeActivity: async (id) => {
    await get().updateActivity(id, { status: 'completed' });
  },

  syncActivitiesToCalendar: () => {
    try {
      const activities = get().activities;
      const calendarEvents = activities.map(convertActivityToCalendarEvent);
      
      set({ calendarEvents });
      console.log('🔄 Synchronisation calendrier:', calendarEvents.length, 'événements');
    } catch (error) {
      console.error('❌ Erreur syncActivitiesToCalendar:', error);
    }
  },

  getActivitiesByProspect: (prospectId) => {
    return get().activities.filter(activity => activity.prospect_id === prospectId);
  },

  getUpcomingActivities: () => {
    const now = new Date();
    return get().activities
      .filter(activity => 
        activity.status === 'pending' && 
        new Date(activity.activity_date) >= now
      )
      .sort((a, b) => new Date(a.activity_date).getTime() - new Date(b.activity_date).getTime());
  },

  getCalendarEvents: () => {
    return get().calendarEvents;
  },

  refreshCalendar: async () => {
    await get().loadActivities();
  }
}); 