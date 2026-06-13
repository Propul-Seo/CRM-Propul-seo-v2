import { Activity, CalendarEvent, ACTIVITY_TYPE_COLORS } from '../hooks/useActivities';
import { logger } from '@/lib/logger';

/**
 * Service de synchronisation des activités CRM vers le calendrier
 * Gère la conversion des activités en événements calendrier et la synchronisation temps réel
 */
export class ActivitySyncService {
  private static instance: ActivitySyncService;
  private syncCallbacks: ((events: CalendarEvent[]) => void)[] = [];

  private constructor() {}

  static getInstance(): ActivitySyncService {
    if (!ActivitySyncService.instance) {
      ActivitySyncService.instance = new ActivitySyncService();
    }
    return ActivitySyncService.instance;
  }

  /**
   * Convertir une activité en événement de calendrier
   */
  convertActivityToCalendarEvent(activity: Activity): CalendarEvent {
    const color = ACTIVITY_TYPE_COLORS[activity.activity_type];
    const activityDate = new Date(activity.activity_date);
    
    // Calculer l'heure de fin (1h après le début par défaut)
    const endDate = new Date(activityDate.getTime() + 60 * 60 * 1000);
    
    return {
      id: activity.id,
      title: `${activity.prospect_name} - ${activity.title}`,
      start: activity.activity_date,
      end: endDate.toISOString(),
      backgroundColor: color,
      borderColor: color,
      extendedProps: {
        activity,
        type: 'activity'
      }
    };
  }

  /**
   * Convertir une liste d'activités en événements calendrier
   */
  convertActivitiesToCalendarEvents(activities: Activity[]): CalendarEvent[] {
    return activities.map(activity => this.convertActivityToCalendarEvent(activity));
  }

  /**
   * Filtrer les activités pour le calendrier
   */
  filterActivitiesForCalendar(activities: Activity[]): Activity[] {
    // Filtrer les activités annulées et celles sans date
    return activities.filter(activity => 
      activity.status !== 'cancelled' && 
      activity.activity_date && 
      activity.activity_date !== ''
    );
  }

  /**
   * Synchroniser les activités avec le calendrier
   */
  syncActivitiesToCalendar(activities: Activity[]): CalendarEvent[] {
    try {
      // Filtrer les activités pertinentes
      const filteredActivities = this.filterActivitiesForCalendar(activities);
      
      // Convertir en événements calendrier
      const calendarEvents = this.convertActivitiesToCalendarEvents(filteredActivities);
      
      // Notifier tous les composants abonnés
      this.notifySync(calendarEvents);
      
      logger.debug('🔄 Synchronisation calendrier:', calendarEvents.length, 'événements');
      return calendarEvents;
    } catch (error) {
      logger.error('❌ Erreur lors de la synchronisation:', error);
      return [];
    }
  }

  /**
   * S'abonner aux changements de synchronisation
   */
  onSync(callback: (events: CalendarEvent[]) => void) {
    this.syncCallbacks.push(callback);
    
    // Retourner une fonction de désabonnement
    return () => {
      this.syncCallbacks = this.syncCallbacks.filter(cb => cb !== callback);
    };
  }

  /**
   * Notifier tous les composants abonnés
   */
  private notifySync(events: CalendarEvent[]) {
    this.syncCallbacks.forEach(callback => {
      try {
        callback(events);
      } catch (error) {
        logger.error('❌ Erreur lors de la notification de synchronisation:', error);
      }
    });
  }

  /**
   * Obtenir les événements pour une date spécifique
   */
  getEventsForDate(activities: Activity[], date: string): CalendarEvent[] {
    const targetDate = new Date(date);
    const dayStart = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate());
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    const dayActivities = activities.filter(activity => {
      const activityDate = new Date(activity.activity_date);
      return activityDate >= dayStart && activityDate < dayEnd;
    });

    return this.convertActivitiesToCalendarEvents(dayActivities);
  }

  /**
   * Obtenir les événements pour une période
   */
  getEventsForPeriod(activities: Activity[], startDate: string, endDate: string): CalendarEvent[] {
    const start = new Date(startDate);
    const end = new Date(endDate);

    const periodActivities = activities.filter(activity => {
      const activityDate = new Date(activity.activity_date);
      return activityDate >= start && activityDate <= end;
    });

    return this.convertActivitiesToCalendarEvents(periodActivities);
  }

  /**
   * Obtenir les statistiques des activités
   */
  getActivityStats(activities: Activity[]) {
    const total = activities.length;
    const pending = activities.filter(a => a.status === 'pending').length;
    const completed = activities.filter(a => a.status === 'completed').length;
    const cancelled = activities.filter(a => a.status === 'cancelled').length;

    const today = new Date();
    const todayActivities = activities.filter(activity => {
      const activityDate = new Date(activity.activity_date);
      return activityDate.toDateString() === today.toDateString();
    });

    const upcomingActivities = activities.filter(activity => {
      const activityDate = new Date(activity.activity_date);
      return activityDate > today && activity.status === 'pending';
    });

    return {
      total,
      pending,
      completed,
      cancelled,
      today: todayActivities.length,
      upcoming: upcomingActivities.length
    };
  }

  /**
   * Obtenir les activités par type
   */
  getActivitiesByType(activities: Activity[]) {
    const byType: Record<string, number> = {};
    
    activities.forEach(activity => {
      byType[activity.activity_type] = (byType[activity.activity_type] || 0) + 1;
    });

    return byType;
  }

  /**
   * Obtenir les activités par priorité
   */
  getActivitiesByPriority(activities: Activity[]) {
    const byPriority: Record<string, number> = {};
    
    activities.forEach(activity => {
      byPriority[activity.priority] = (byPriority[activity.priority] || 0) + 1;
    });

    return byPriority;
  }

  /**
   * Vérifier les conflits d'horaires
   */
  checkTimeConflicts(activities: Activity[]): Activity[] {
    const conflicts: Activity[] = [];
    
    for (let i = 0; i < activities.length; i++) {
      for (let j = i + 1; j < activities.length; j++) {
        const activity1 = activities[i];
        const activity2 = activities[j];
        
        const date1 = new Date(activity1.activity_date);
        const date2 = new Date(activity2.activity_date);
        
        // Vérifier si les activités sont le même jour et à la même heure
        if (Math.abs(date1.getTime() - date2.getTime()) < 30 * 60 * 1000) { // 30 minutes
          if (!conflicts.find(c => c.id === activity1.id)) {
            conflicts.push(activity1);
          }
          if (!conflicts.find(c => c.id === activity2.id)) {
            conflicts.push(activity2);
          }
        }
      }
    }
    
    return conflicts;
  }
}

// Instance globale du service
export const activitySyncService = ActivitySyncService.getInstance(); 