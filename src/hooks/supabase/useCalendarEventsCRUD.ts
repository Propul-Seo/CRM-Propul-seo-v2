import { useState } from 'react';
import { logger } from '@/lib/logger';
import { supabase } from '../../lib/supabase';
import { toast } from 'sonner';
import { useStore } from '../../store/useStore';
import type {
  CalendarEventInsert,
  CalendarEventUpdate,
  CalendarEventRow,
  CRUDResult,
} from '../../types/supabase-types';

// Hook CRUD pour les événements du calendrier
export function useCalendarEventsCRUD() {
  const [loading, setLoading] = useState(false);
  const { currentUser } = useStore();

  const createEvent = async (eventData: Partial<CalendarEventInsert>): Promise<CRUDResult<CalendarEventRow>> => {
    setLoading(true);
    try {
      const adaptedData: CalendarEventInsert = {
        title: eventData.title || 'Nouvel événement',
        user_id: currentUser?.id || '',
        assigned_to: eventData.assigned_to || currentUser?.id || '',
        category: eventData.category || 'general',
        start_time: eventData.start_time || new Date().toISOString(),
        end_time: eventData.end_time || new Date().toISOString(),
        event_type: (eventData as { type?: string }).type as CalendarEventInsert['event_type'] ||
                    eventData.event_type || 'rdv_client',
        description: eventData.description,
        is_all_day: eventData.is_all_day
      };

      const { data, error } = await supabase
        .from('calendar_events')
        .insert([adaptedData])
        .select()
        .single();

      if (error) throw error;

      toast.success('Événement créé avec succès');
      return { success: true, data: data as CalendarEventRow };
    } catch (error) {
      const err = error as Error;
      logger.error('Error creating event:', err);
      toast.error("Erreur lors de la création de l'événement");
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const updateEvent = async (id: string, updates: CalendarEventUpdate & { type?: string }): Promise<CRUDResult<CalendarEventRow>> => {
    setLoading(true);
    try {
      const adaptedUpdates: CalendarEventUpdate = {
        ...updates,
        ...(updates.type && { event_type: updates.type as CalendarEventUpdate['event_type'] })
      };

      // Remove non-standard field
      delete (adaptedUpdates as { type?: string }).type;

      const { data, error } = await supabase
        .from('calendar_events')
        .update(adaptedUpdates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast.success('Événement mis à jour');
      return { success: true, data: data as CalendarEventRow };
    } catch (error) {
      const err = error as Error;
      logger.error('Error updating event:', err);
      toast.error('Erreur lors de la mise à jour');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteEvent = async (id: string): Promise<CRUDResult<void>> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('calendar_events')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast.success('Événement supprimé');
      return { success: true };
    } catch (error) {
      const err = error as Error;
      logger.error('Error deleting event:', err);
      toast.error('Erreur lors de la suppression');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  return { createEvent, updateEvent, deleteEvent, loading };
}
