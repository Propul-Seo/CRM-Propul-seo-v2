import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Store } from './types';
import { createAuthSlice } from './slices/authSlice';
import { createUiSlice } from './slices/uiSlice';
import { createCrmSlice } from './slices/crmSlice';
import { createProjectsSlice } from './slices/projectsSlice';
import { createAccountingSlice } from './slices/accountingSlice';
import { createTasksSlice } from './slices/tasksSlice';

export type { Store };

export const useStore = create<Store>()(
  persist(
    (...a) => ({
      ...createAuthSlice(...a),
      ...createUiSlice(...a),
      ...createCrmSlice(...a),
      ...createProjectsSlice(...a),
      ...createAccountingSlice(...a),
      ...createTasksSlice(...a),
    }),
    {
      name: 'propulseo-store',
      version: 1,
      // SP0 : projects/accountingData ne sont plus persistés (source de vérité = Supabase).
      // migrate purge l'ancien cache localStorage (version 0) pour éviter des données stale.
      migrate: (persisted, version) => {
        if (version < 1 && persisted && typeof persisted === 'object') {
          const rest = { ...(persisted as Partial<Store>) };
          delete rest.projects;
          delete rest.accountingData;
          // Zustand réhydrate les slices retirés depuis leurs valeurs par défaut
          // (projects=[], accountingData=createInitialAccountingData()) → cast sûr.
          return rest as Store;
        }
        return persisted as Store;
      },
      partialize: (state) => ({
        // Don't persist Supabase data, it will be loaded fresh each time
        currentUser: state.currentUser,
        darkMode: state.darkMode,
        showCompletedTasks: state.showCompletedTasks,
        sidebarCollapsed: state.sidebarCollapsed,
        // projects + accountingData retirés en SP0 : rechargés depuis Supabase à chaque montage
        // Don't persist chat data - will come from Supabase
        // Keep calendar sync settings
        calendarSyncSettings: state.calendarSyncSettings,
        // Keep undo history
        undoHistory: state.undoHistory,
        // Keep dashboard objectives
        dashboardObjectives: state.dashboardObjectives,
      }),
    }
  )
);
