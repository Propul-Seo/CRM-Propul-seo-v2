import type { StateCreator } from 'zustand';
import { toast } from 'sonner';
import type { Store, AccountingSlice, AccountingEntry } from '../types';
import { createInitialAccountingData, recalcMonthlyData, computeAccountingSummary } from '../helpers';

export const createAccountingSlice: StateCreator<Store, [], [], AccountingSlice> = (set, get) => ({
  accountingData: createInitialAccountingData(),
  undoHistory: [],

  addAccountingEntry: (entry) => {
    const newEntry: AccountingEntry = {
      ...entry,
      id: Date.now().toString(),
    };

    set((state) => ({
      accountingData: {
        ...state.accountingData,
        entries: [...state.accountingData.entries, newEntry],
        monthlyData: recalcMonthlyData(state.accountingData.monthlyData, newEntry, 'add'),
      }
    }));

    get().addUndoAction({
      type: 'delete',
      entityType: 'accountingEntry',
      entityId: newEntry.id,
      data: newEntry,
      timestamp: Date.now()
    });
    toast.success('Entrée comptable ajoutée avec succès');
  },

  updateAccountingEntry: (id, updates) => {
    set((state) => {
      const entryIndex = state.accountingData.entries.findIndex(e => e.id === id);
      if (entryIndex === -1) return state;
      const oldEntry = state.accountingData.entries[entryIndex];
      const updatedEntry = { ...oldEntry, ...updates };
      const newEntries = [...state.accountingData.entries];
      newEntries[entryIndex] = updatedEntry;
      let monthlyData = recalcMonthlyData(state.accountingData.monthlyData, oldEntry, 'remove');
      monthlyData = recalcMonthlyData(monthlyData, updatedEntry, 'add');

      return {
        accountingData: {
          ...state.accountingData,
          entries: newEntries,
          monthlyData
        }
      };
    });

    toast.success('Entrée comptable mise à jour');
  },

  deleteAccountingEntry: (id) => {
    const state = get();
    const entryToDelete = state.accountingData.entries.find(e => e.id === id);
    if (!entryToDelete) return;

    set((state) => ({
      accountingData: {
        ...state.accountingData,
        entries: state.accountingData.entries.filter(e => e.id !== id),
        monthlyData: recalcMonthlyData(state.accountingData.monthlyData, entryToDelete, 'remove'),
      }
    }));

    get().addUndoAction({
      type: 'create',
      entityType: 'accountingEntry',
      entityId: id,
      data: entryToDelete,
      timestamp: Date.now()
    });
    toast.success('Entrée comptable supprimée');
  },

  getAccountingSummary: () => computeAccountingSummary(get().accountingData),

  addUndoAction: (action) => {
    set((state) => ({
      undoHistory: [...state.undoHistory.slice(-9), action] // Keep last 10 actions
    }));
  },

  performUndo: () => {
    const state = get();
    if (state.undoHistory.length === 0) return;

    const lastAction = state.undoHistory[state.undoHistory.length - 1];
    switch (lastAction.entityType) {
      case 'accountingEntry':
        if (lastAction.type === 'delete') {
          get().addAccountingEntry(lastAction.data as any);
        } else if (lastAction.type === 'create') {
          get().deleteAccountingEntry(lastAction.entityId);
        }
        break;
    }
    set((state) => ({
      undoHistory: state.undoHistory.slice(0, -1)
    }));

    toast.success('Action annulée');
  },

  clearUndoHistory: () => set({ undoHistory: [] }),
});
