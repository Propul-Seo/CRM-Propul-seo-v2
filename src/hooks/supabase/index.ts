// Core
export { useSupabaseData } from './useSupabaseQuery';
export type { UseSupabaseDataOptions, UseSupabaseDataResult } from './types';

// Query hooks
export {
  useSupabaseUsers,
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
} from './useQueryHooks';

export { useSupabaseContacts } from './useContactsQuery';
export { useSupabaseRevenueCalculation } from './useRevenueCalculation';

// CRUD hooks
export { useTasksCRUD } from './useTasksCRUD';
export { useCalendarEventsCRUD } from './useCalendarEventsCRUD';
export { useAccountingCRUD } from './useAccountingCRUD';
export { useContactsCRUD } from './useContactsCRUD';
export { useProjectsCRUD } from './useProjectsCRUD';
export { useChannelsCRUD } from './useChannelsCRUD';
export { useMessagesCRUD } from './useMessagesCRUD';

// Communication hooks
export { useSupabasePosts, useSupabasePostAssets, useSupabasePostComments } from './usePostsQuery';
export { usePostsCRUD } from './usePostsCRUD';

// KPI / Metrics hooks
export { useSupabasePostMetrics, useKPIMonthlyOverview, useKPIDailyMetrics, useKPITopPosts } from './usePostMetricsQuery';
export { usePostMetricsCRUD } from './usePostMetricsCRUD';

// Personal Tasks hooks
export { usePersonalTasks } from './usePersonalTasksQuery';
export { usePersonalTasksCRUD } from './usePersonalTasksCRUD';

// Social Connections hooks
export { useSupabaseSocialConnections } from './useSocialConnectionsQuery';
export { useSocialConnectionsCRUD } from './useSocialConnectionsCRUD';
