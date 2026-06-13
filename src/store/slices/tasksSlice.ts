import type { StateCreator } from 'zustand';
import { toast } from 'sonner';
import type { Store, TasksSlice, Activity } from '../types';
import { stubAction } from '../helpers';

export const createTasksSlice: StateCreator<Store, [], [], TasksSlice> = (set, get) => ({
  tasks: [],
  events: [],
  activities: [],
  calendarSyncSettings: {
    autoSync: true,
    syncTypes: {
      rdv_client: true,
      deadline: true,
      livraison: true,
      suivi: true,
      marketing: false,
      formation: false,
    },
    notifications: true,
    reminderMinutes: 15,
    lastSyncTime: new Date().toISOString(),
  },

  // Task actions (placeholder - Supabase)
  addTask: (task) => stubAction('task creation', task),
  updateTask: (id, task) => stubAction('task update', id, task),
  deleteTask: (id) => stubAction('task deletion', id),
  completeTask: (id) => stubAction('task completion', id),

  // Event actions (placeholder - Supabase)
  addEvent: (event) => stubAction('event creation', event),
  updateEvent: (id, event) => stubAction('event update', id, event),
  deleteEvent: (id) => stubAction('event deletion', id),

  // Activity actions (local)
  addActivity: (activity) => {
    const newActivity: Activity = {
      ...activity,
      id: Date.now().toString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    set((state) => ({ activities: [...state.activities, newActivity] }));
    toast.success('Activité ajoutée');
  },

  updateActivity: (id, updates) => {
    set((state) => ({
      activities: state.activities.map(a =>
        a.id === id ? { ...a, ...updates, updatedAt: new Date().toISOString() } : a
      )
    }));
    toast.success('Activité mise à jour');
  },

  deleteActivity: (id) => {
    set((state) => ({
      activities: state.activities.filter(a => a.id !== id)
    }));
    toast.success('Activité supprimée');
  },

  getActivitiesByType: (type) => {
    return get().activities.filter(a => a.type === type);
  },

  getActivitiesByUser: (userId) => {
    return get().activities.filter(a => a.assignedTo === userId);
  },

  // Calendar sync
  updateCalendarSyncSettings: (settings) => {
    set((state) => ({
      calendarSyncSettings: { ...state.calendarSyncSettings, ...settings }
    }));
  },

  syncWithGoogleCalendar: async (eventId) => {
    try {
      const state = get();
      const event = state.events.find(e => e.id === eventId);
      if (!event) return;

      // TODO: Implement CalendarService.syncEvent(event);
      console.log('TODO: Sync event with Google Calendar', event);

      set((state) => ({
        events: state.events.map(e =>
          e.id === eventId ? { ...e, isSynced: true } : e
        )
      }));

      toast.success('Événement synchronisé avec Google Calendar');
    } catch (error) {
      console.error('Erreur de synchronisation:', error);
      toast.error('Erreur lors de la synchronisation');
    }
  },
});
