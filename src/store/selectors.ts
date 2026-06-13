import type { Store } from './types';

// ===== Auth =====
// Usage: const currentUser = useStore(selectCurrentUser)
export const selectCurrentUser = (state: Store) => state.currentUser;
export const selectIsAccessGranted = (state: Store) => state.isAccessGranted;

// ===== UI =====
// Usage: const darkMode = useStore(selectDarkMode)
export const selectSidebarCollapsed = (state: Store) => state.sidebarCollapsed;
export const selectDarkMode = (state: Store) => state.darkMode;
export const selectShowCompletedTasks = (state: Store) => state.showCompletedTasks;
export const selectDashboardObjectives = (state: Store) => state.dashboardObjectives;

// ===== CRM Data =====
// Usage: const clients = useStore(selectClients)
export const selectClients = (state: Store) => state.clients;
export const selectLeads = (state: Store) => state.leads;
export const selectCampaigns = (state: Store) => state.campaigns;
export const selectQuotes = (state: Store) => state.quotes;
export const selectMetrics = (state: Store) => state.metrics;
export const selectUsers = (state: Store) => state.users;
export const selectChartData = (state: Store) => state.chartData;

// ===== Projects =====
// Usage: const projects = useStore(selectProjects)
export const selectProjects = (state: Store) => state.projects;
export const selectActiveProjects = (state: Store) =>
  state.projects.filter(p => !p.isArchived && p.status !== 'completed');
export const selectArchivedProjects = (state: Store) =>
  state.projects.filter(p => p.isArchived);

// ===== Tasks & Calendar =====
// Usage: const tasks = useStore(selectTasks)
export const selectTasks = (state: Store) => state.tasks;
export const selectEvents = (state: Store) => state.events;
export const selectActivities = (state: Store) => state.activities;
export const selectCalendarSyncSettings = (state: Store) => state.calendarSyncSettings;

// ===== Accounting =====
// Usage: const entries = useStore(selectAccountingEntries)
export const selectAccountingData = (state: Store) => state.accountingData;
export const selectAccountingEntries = (state: Store) => state.accountingData.entries;
export const selectUndoHistory = (state: Store) => state.undoHistory;
