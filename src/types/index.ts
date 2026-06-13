// =====================================================
// TYPES CENTRALISÉS - CRM PROFESSIONNEL
// =====================================================

// Types d'authentification
export type UserRole = 'admin' | 'user' | 'viewer';

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: UserRole;
}

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

// Types de contacts/leads
export interface Contact {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone?: string;
  value?: number;
  status: 'prospect' | 'qualified' | 'lost';
  source?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

// Types de projets
export interface Project {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'in_progress' | 'review' | 'completed' | 'on_hold';
  created_at: string;
  updated_at: string;
}

// Types de accounting_entries
export interface Transaction {
  id: string;
  type: 'revenue' | 'expense';
  description: string;
  amount: number;
  date: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

// Types de tâches
export interface Task {
  id: string;
  title: string;
  description?: string;
  status: 'todo' | 'in_progress' | 'waiting' | 'done';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assigned_to?: string;
  project_id?: string;
  deadline?: string;
  category: string;
  created_at: string;
  updated_at: string;
}

// Types d'événements calendrier
export interface CalendarEvent {
  id: string;
  title: string;
  description?: string;
  start_time: string;
  end_time: string;
  event_type: 'meeting' | 'task' | 'reminder' | 'other';
  is_all_day: boolean;
  category: string;
  created_at: string;
  updated_at: string;
}

// Types de store global
export interface Store {
  // Authentification
  user: User | null;
  setUser: (user: User | null) => void;
  
  // Données
  contacts: Contact[];
  projects: Project[];
  accounting_entries: Transaction[];
  tasks: Task[];
  events: CalendarEvent[];
  
  // Actions
  addContact: (contact: Contact) => void;
  updateContact: (id: string, updates: Partial<Contact>) => void;
  deleteContact: (id: string) => void;
  
  addProject: (project: Project) => void;
  updateProject: (id: string, updates: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  
  addTransaction: (transaction: Transaction) => void;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;
  
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  
  addEvent: (event: CalendarEvent) => void;
  updateEvent: (id: string, updates: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
}

// Types d'API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Types de formulaires
export interface FormData {
  [key: string]: string | number | boolean | null | undefined;
}

// Types d'utilitaires
export interface DateRange {
  start: Date;
  end: Date;
}

export interface FilterOptions {
  status?: string;
  category?: string;
  dateRange?: DateRange;
  search?: string;
}

// Types supplémentaires pour le store
export interface Client {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  status: 'active' | 'inactive' | 'prospect';
  value?: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Quote {
  id: string;
  clientId: string;
  title: string;
  description?: string;
  amount: number;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
  validUntil: string;
  createdAt: string;
  updatedAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'planning' | 'active' | 'paused' | 'completed';
  budget?: number;
  startDate: string;
  endDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Lead {
  id: string;
  name: string;
  email: string;
  phone?: string;
  company?: string;
  source: string;
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'lost';
  value?: number;
  notes?: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Metrics {
  monthlyRevenue: number;
  clientCount: number;
  conversionRate: number;
  activeProjects: number;
  monthlyGrowth: number;
  salesMetrics: {
    leadsGenerated: number;
    leadsConverted: number;
    averageDealSize: number;
    salesCycle: number;
  };
  marketingMetrics: {
    websiteVisitors: number;
    socialFollowers: number;
    emailSubscribers: number;
    campaignROI: number;
  };
}

export interface ChartData {
  label: string;
  value: number;
  color?: string;
}

export interface MonthlyAccountingData {
  month: string;
  revenue: number;
  expenses: number;
  netResult: number;
  entries: string[];
}

export interface AccountingData {
  entries: AccountingEntry[];
  monthlyData: Record<string, MonthlyAccountingData>;
  categories: string[];
}

export interface AccountingEntry {
  id: string;
  type: 'income' | 'expense';
  description: string;
  amount: number;
  date: string;
  category: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccountingSummary {
  currentMonthRevenue: number;
  currentMonthExpenses: number;
  currentMonthNetResult: number;
  totalRevenue: number;
  totalExpenses: number;
  totalNetResult: number;
  entriesCount: number;
}

export interface UndoAction {
  type: 'create' | 'update' | 'delete';
  entityType: string;
  entityId: string;
  data: Record<string, unknown>;
  timestamp: number;
}

export interface CalendarSyncSettings {
  autoSync: boolean;
  syncTypes: {
    rdv_client: boolean;
    deadline: boolean;
    livraison: boolean;
    suivi: boolean;
    marketing: boolean;
    formation: boolean;
  };
  notifications: boolean;
  reminderMinutes: number;
  lastSyncTime: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  senderId: string;
  senderName: string;
  timestamp: string;
  type: 'text' | 'file' | 'image';
  attachments?: string[];
}

export interface ChatGroup {
  id: string;
  name: string;
  description?: string;
  members: string[];
  isPrivate: boolean;
  createdAt: string;
  updatedAt: string;
}

// Types pour les activités
export interface Activity {
  id: string;
  type: 'task' | 'event' | 'project' | 'client' | 'lead';
  title: string;
  description?: string;
  status: string;
  priority?: string;
  assignedTo?: string;
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ActivitiesSlice {
  activities: Activity[];
  addActivity: (activity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateActivity: (id: string, updates: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;
  getActivitiesByType: (type: Activity['type']) => Activity[];
  getActivitiesByUser: (userId: string) => Activity[];
}