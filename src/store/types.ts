// ===== Domain Types =====

export interface User {
  id: string;
  email: string;
  name?: string;
  role?: string;
}

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

export interface DashboardObjective {
  id: string;
  label: string;
  target: number;
  unit: string;
  type: 'revenue' | 'projects' | 'activeProjects' | 'custom';
}

export interface Project {
  id: string;
  name: string;
  clientId: string;
  clientName: string;
  status: 'planning' | 'in_progress' | 'review' | 'completed' | 'on_hold';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedTo: string;
  startDate: string;
  endDate?: string;
  budget?: number;
  progress: number;
  description?: string;
  category: string;
  completedAt?: string;
  isArchived?: boolean;
}

// ===== Slice Interfaces =====

export interface AuthSlice {
  accessCode: string;
  isAccessGranted: boolean;
  currentUser: User | null;
  setAccessCode: (code: string) => void;
  grantAccess: () => void;
  verifyAccessCode: (code: string) => boolean;
  setCurrentUser: (user: User | null) => void;
  logout: () => void;
}

export interface UiSlice {
  sidebarCollapsed: boolean;
  darkMode: boolean;
  showCompletedTasks: boolean;
  dashboardObjectives: DashboardObjective[];
  setSidebarCollapsed: (collapsed: boolean) => void;
  setDarkMode: (darkMode: boolean) => void;
  setShowCompletedTasks: (show: boolean) => void;
  updateDashboardObjective: (id: string, updates: Partial<DashboardObjective>) => void;
  resetDashboardObjectives: () => void;
}

export interface CrmSlice {
  clients: Client[];
  quotes: Quote[];
  users: User[];
  campaigns: Campaign[];
  leads: Lead[];
  metrics: Metrics;
  chartData: ChartData[];
  chatGroups: ChatGroup[];
  chatMessages: Record<string, ChatMessage[]>;
  addClient: (client: Omit<Client, 'id'>) => void;
  updateClient: (id: string, client: Partial<Client>) => void;
  deleteClient: (id: string) => void;
  addQuote: (quote: Omit<Quote, 'id'>) => void;
  updateQuote: (id: string, quote: Partial<Quote>) => void;
  deleteQuote: (id: string) => void;
  addCampaign: (campaign: Omit<Campaign, 'id'>) => void;
  updateCampaign: (id: string, campaign: Partial<Campaign>) => void;
  deleteCampaign: (id: string) => void;
  addLead: (lead: Omit<Lead, 'id'>) => void;
  updateLead: (id: string, lead: Partial<Lead>) => void;
  deleteLead: (id: string) => void;
  addChatGroup: (group: Omit<ChatGroup, 'id'>) => void;
  updateChatGroup: (id: string, group: Partial<ChatGroup>) => void;
  deleteChatGroup: (id: string) => void;
  addChatMessage: (groupId: string, message: Omit<ChatMessage, 'id'>) => void;
  updateChatMessage: (groupId: string, messageId: string, message: Partial<ChatMessage>) => void;
  deleteChatMessage: (groupId: string, messageId: string) => void;
  initializeEmptyData: () => void;
}

export interface ProjectsSlice {
  projects: Project[];
  addProject: (project: Omit<Project, 'id'>) => void;
  updateProject: (id: string, project: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  archiveProject: (id: string) => void;
}

export interface AccountingSlice {
  accountingData: AccountingData;
  undoHistory: UndoAction[];
  addAccountingEntry: (entry: Omit<AccountingEntry, 'id'>) => void;
  updateAccountingEntry: (id: string, entry: Partial<AccountingEntry>) => void;
  deleteAccountingEntry: (id: string) => void;
  getAccountingSummary: () => AccountingSummary;
  addUndoAction: (action: UndoAction) => void;
  performUndo: () => void;
  clearUndoHistory: () => void;
}

export interface TasksSlice {
  tasks: Task[];
  events: CalendarEvent[];
  activities: Activity[];
  calendarSyncSettings: CalendarSyncSettings;
  addTask: (task: Omit<Task, 'id' | 'createdAt' | 'updatedAt' | 'comments'>) => void;
  updateTask: (id: string, task: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  completeTask: (id: string) => void;
  addEvent: (event: Omit<CalendarEvent, 'id'>) => void;
  updateEvent: (id: string, event: Partial<CalendarEvent>) => void;
  deleteEvent: (id: string) => void;
  addActivity: (activity: Omit<Activity, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateActivity: (id: string, updates: Partial<Activity>) => void;
  deleteActivity: (id: string) => void;
  getActivitiesByType: (type: Activity['type']) => Activity[];
  getActivitiesByUser: (userId: string) => Activity[];
  updateCalendarSyncSettings: (settings: Partial<CalendarSyncSettings>) => void;
  syncWithGoogleCalendar: (eventId: string) => Promise<void>;
}

// ===== Combined Store Type =====

export type Store = AuthSlice &
  UiSlice &
  CrmSlice &
  ProjectsSlice &
  AccountingSlice &
  TasksSlice;
