// Wrapper de compatibilité - réexporte depuis hooks/supabase/
export {
  useSupabaseData,
  useSupabaseUsers,
  useSupabaseContacts,
  useSupabaseProjects,
  useSupabaseTasks,
  useSupabaseCalendarEvents,
  useSupabaseAccountingEntries,
  useSupabaseLeads,
  useSupabaseInvoices,
  useSupabaseQuotes,
  useSupabaseActivityLog,
  useSupabaseChannels,
  useSupabaseMessages,
  useSupabaseRevenueCalculation,
  useTasksCRUD,
  useCalendarEventsCRUD,
  useAccountingCRUD,
  useContactsCRUD,
  useProjectsCRUD,
  useChannelsCRUD,
  useMessagesCRUD,
} from './supabase';

export type { UseSupabaseDataOptions, UseSupabaseDataResult } from './supabase';
