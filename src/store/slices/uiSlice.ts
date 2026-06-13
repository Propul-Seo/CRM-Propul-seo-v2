import type { StateCreator } from 'zustand';
import { toast } from 'sonner';
import type { Store, UiSlice, DashboardObjective } from '../types';

const defaultDashboardObjectives: DashboardObjective[] = [
  { id: 'revenue', label: 'CA Annuel', target: 100000, unit: '€', type: 'revenue' },
  { id: 'projects', label: 'Nouveaux Projets', target: 25, unit: '', type: 'projects' },
  { id: 'activeProjects', label: 'Projets Actifs', target: 8, unit: '', type: 'activeProjects' },
];

export const createUiSlice: StateCreator<Store, [], [], UiSlice> = (set) => ({
  sidebarCollapsed: false,
  darkMode: false,
  showCompletedTasks: false,
  dashboardObjectives: defaultDashboardObjectives,

  setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
  setDarkMode: (darkMode) => set({ darkMode }),
  setShowCompletedTasks: (show) => set({ showCompletedTasks: show }),

  updateDashboardObjective: (id, updates) => {
    set((state) => ({
      dashboardObjectives: state.dashboardObjectives.map(obj =>
        obj.id === id ? { ...obj, ...updates } : obj
      )
    }));
    toast.success('Objectif mis à jour');
  },

  resetDashboardObjectives: () => {
    set({ dashboardObjectives: defaultDashboardObjectives });
    toast.success('Objectifs réinitialisés');
  },
});
