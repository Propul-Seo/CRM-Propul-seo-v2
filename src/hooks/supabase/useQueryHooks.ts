import { useSupabaseData } from './useSupabaseQuery';
import type {
  UserProfileRow,
  ProjectRow,
  TaskRow,
  CalendarEventRow,
  AccountingEntryRow,
  LeadRow,
  QuoteRow,
  ChannelRow,
  MessageRow,
} from '../../types/supabase-types';

// Hook spécialisé pour les utilisateurs
export function useSupabaseUsers() {
  return useSupabaseData<UserProfileRow>({
    table: 'users',
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });
}

// Hook spécialisé pour les projets
export function useSupabaseProjects() {
  const result = useSupabaseData<ProjectRow>({
    table: 'projects',
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });

  // Mapper les statuts de la base de données vers l'interface
  const mappedData = result.data?.map((project) => ({
    ...project,
    status: project.status === 'on_hold' ? 'paused' : project.status
  })) || [];

  return {
    ...result,
    data: mappedData
  };
}

// Hook spécialisé pour les tâches
export function useSupabaseTasks() {
  return useSupabaseData<TaskRow>({
    table: 'tasks',
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });
}

// Hook spécialisé pour les événements du calendrier
export function useSupabaseCalendarEvents() {
  return useSupabaseData<CalendarEventRow>({
    table: 'calendar_events',
    select: '*',
    orderBy: { column: 'start_time', ascending: true }
  });
}

// Hook spécialisé pour les données comptables
export function useSupabaseAccountingEntries() {
  return useSupabaseData<AccountingEntryRow>({
    table: 'accounting_entries',
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });
}
export function useSupabaseLeads() {
  return useSupabaseData<LeadRow>({
    table: 'leads',
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });
}
export function useSupabaseInvoices() {
  return useSupabaseData<{ id: string; [key: string]: unknown }>({
    table: 'invoices',
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });
}
export function useSupabaseQuotes() {
  return useSupabaseData<QuoteRow>({
    table: 'quotes',
    select: '*',
    orderBy: { column: 'created_at', ascending: false }
  });
}
export function useSupabaseActivityLog() {
  return useSupabaseData<{ id: string; created_at: string; [key: string]: unknown }>({
    table: 'activity_log',
    select: '*',
    orderBy: { column: 'created_at', ascending: false },
    limit: 50
  });
}
export function useSupabaseChannels() {
  return useSupabaseData<ChannelRow>({
    table: 'channels',
    select: '*',
    orderBy: { column: 'created_at', ascending: true }
  });
}

// Hook pour les messages d'un canal
export function useSupabaseMessages(channelId?: string) {
  return useSupabaseData<MessageRow>({
    table: 'messages',
    select: '*, users(name, email)',
    filters: channelId ? { channel_id: channelId } : {},
    orderBy: { column: 'created_at', ascending: true }
  });
}
