import { create } from 'zustand';
import type {
  AccountingEntryRow,
  ContactRow,
  ProjectRow,
  TaskRow,
  CalendarEventRow,
  ChannelRow,
  MessageRow,
  AccountingEntryUpdate,
  ContactUpdate,
  ProjectUpdate,
  TaskUpdate,
  CalendarEventUpdate,
  ChannelUpdate,
  MessageUpdate,
} from '../types/supabase-types';

interface RealtimeState {
  // Data arrays with proper types
  accountingEntries: AccountingEntryRow[];
  contacts: ContactRow[];
  projects: ProjectRow[];
  tasks: TaskRow[];
  calendarEvents: CalendarEventRow[];
  channels: ChannelRow[];
  messages: MessageRow[];

  // Actions pour accounting_entries
  setAccountingEntries: (entries: AccountingEntryRow[]) => void;
  addAccountingEntry: (entry: AccountingEntryRow) => void;
  updateAccountingEntry: (id: string, updates: AccountingEntryUpdate) => void;
  removeAccountingEntry: (id: string) => void;

  // Actions pour contacts
  setContacts: (contacts: ContactRow[]) => void;
  addContact: (contact: ContactRow) => void;
  updateContact: (id: string, updates: ContactUpdate) => void;
  removeContact: (id: string) => void;

  // Actions pour projects
  setProjects: (projects: ProjectRow[]) => void;
  addProject: (project: ProjectRow) => void;
  updateProject: (id: string, updates: ProjectUpdate) => void;
  removeProject: (id: string) => void;

  // Actions pour tasks
  setTasks: (tasks: TaskRow[]) => void;
  addTask: (task: TaskRow) => void;
  updateTask: (id: string, updates: TaskUpdate) => void;
  removeTask: (id: string) => void;

  // Actions pour calendar events
  setCalendarEvents: (events: CalendarEventRow[]) => void;
  addCalendarEvent: (event: CalendarEventRow) => void;
  updateCalendarEvent: (id: string, updates: CalendarEventUpdate) => void;
  removeCalendarEvent: (id: string) => void;

  // Actions pour channels
  setChannels: (channels: ChannelRow[]) => void;
  addChannel: (channel: ChannelRow) => void;
  updateChannel: (id: string, updates: ChannelUpdate) => void;
  removeChannel: (id: string) => void;

  // Actions pour messages
  setMessages: (messages: MessageRow[]) => void;
  addMessage: (message: MessageRow) => void;
  updateMessage: (id: string, updates: MessageUpdate) => void;
  removeMessage: (id: string) => void;
}

export const useRealtimeStore = create<RealtimeState>((set) => ({
  // Initial state
  accountingEntries: [],
  contacts: [],
  projects: [],
  tasks: [],
  calendarEvents: [],
  channels: [],
  messages: [],

  // Actions pour accounting_entries
  setAccountingEntries: (entries) => set({ accountingEntries: entries }),
  addAccountingEntry: (entry) => set((state) => ({
    accountingEntries: [...state.accountingEntries, entry]
  })),
  updateAccountingEntry: (id, updates) => set((state) => ({
    accountingEntries: state.accountingEntries.map(e =>
      e.id === id ? { ...e, ...updates } : e
    )
  })),
  removeAccountingEntry: (id) => set((state) => ({
    accountingEntries: state.accountingEntries.filter(e => e.id !== id)
  })),

  // Actions pour contacts
  setContacts: (contacts) => set({ contacts }),
  addContact: (contact) => set((state) => ({
    contacts: [...state.contacts, contact]
  })),
  updateContact: (id, updates) => set((state) => ({
    contacts: state.contacts.map(c =>
      c.id === id ? { ...c, ...updates } : c
    )
  })),
  removeContact: (id) => set((state) => ({
    contacts: state.contacts.filter(c => c.id !== id)
  })),

  // Actions pour projects
  setProjects: (projects) => set({ projects }),
  addProject: (project) => set((state) => ({
    projects: [...state.projects, project]
  })),
  updateProject: (id, updates) => set((state) => ({
    projects: state.projects.map(p =>
      p.id === id ? { ...p, ...updates } : p
    )
  })),
  removeProject: (id) => set((state) => ({
    projects: state.projects.filter(p => p.id !== id)
  })),

  // Actions pour tasks
  setTasks: (tasks) => set({ tasks }),
  addTask: (task) => set((state) => ({
    tasks: [...state.tasks, task]
  })),
  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map(t =>
      t.id === id ? { ...t, ...updates } : t
    )
  })),
  removeTask: (id) => set((state) => ({
    tasks: state.tasks.filter(t => t.id !== id)
  })),

  // Actions pour calendar events
  setCalendarEvents: (events) => set({ calendarEvents: events }),
  addCalendarEvent: (event) => set((state) => ({
    calendarEvents: [...state.calendarEvents, event]
  })),
  updateCalendarEvent: (id, updates) => set((state) => ({
    calendarEvents: state.calendarEvents.map(e =>
      e.id === id ? { ...e, ...updates } : e
    )
  })),
  removeCalendarEvent: (id) => set((state) => ({
    calendarEvents: state.calendarEvents.filter(e => e.id !== id)
  })),

  // Actions pour channels
  setChannels: (channels) => set({ channels }),
  addChannel: (channel) => set((state) => ({
    channels: [...state.channels, channel]
  })),
  updateChannel: (id, updates) => set((state) => ({
    channels: state.channels.map(c =>
      c.id === id ? { ...c, ...updates } : c
    )
  })),
  removeChannel: (id) => set((state) => ({
    channels: state.channels.filter(c => c.id !== id)
  })),

  // Actions pour messages
  setMessages: (messages) => set({ messages }),
  addMessage: (message) => set((state) => ({
    messages: [...state.messages, message]
  })),
  updateMessage: (id, updates) => set((state) => ({
    messages: state.messages.map(m =>
      m.id === id ? { ...m, ...updates } : m
    )
  })),
  removeMessage: (id) => set((state) => ({
    messages: state.messages.filter(m => m.id !== id)
  })),
}));

// Fonctions utilitaires pour les calculs financiers
export const useFinancialCalculations = () => {
  const state = useRealtimeStore();

  const totalRevenue = state.accountingEntries
    .filter(entry => entry.type === 'revenue')
    .reduce((sum, entry) => sum + parseFloat(String(entry.amount)), 0);

  const totalExpenses = state.accountingEntries
    .filter(entry => entry.type === 'expense')
    .reduce((sum, entry) => sum + parseFloat(String(entry.amount)), 0);

  const netResult = totalRevenue - totalExpenses;

  return {
    totalRevenue,
    totalExpenses,
    netResult,
    accountingEntries: state.accountingEntries
  };
};

// Hook pour les entrées comptables
export const useRealtimeAccountingEntries = () => useRealtimeStore(state => state.accountingEntries);

// Hook pour les actions sur les entrées comptables
export const useAccountingEntriesActions = () => useRealtimeStore(state => ({
  setAccountingEntries: state.setAccountingEntries,
  addAccountingEntry: state.addAccountingEntry,
  updateAccountingEntry: state.updateAccountingEntry,
  removeAccountingEntry: state.removeAccountingEntry,
}));
