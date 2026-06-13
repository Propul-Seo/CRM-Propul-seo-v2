// =====================================================
// CONSTANTES - CRM PROFESSIONNEL
// =====================================================

// Statuts des contacts
export const CONTACT_STATUSES = {
  PROSPECT: 'prospect',
  QUALIFIED: 'qualified',
  LOST: 'lost'
} as const;

// Statuts des projets
export const PROJECT_STATUSES = {
  PLANNING: 'planning',
  IN_PROGRESS: 'in_progress',
  REVIEW: 'review',
  COMPLETED: 'completed',
  ON_HOLD: 'on_hold'
} as const;

// Priorités des tâches
export const TASK_PRIORITIES = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  URGENT: 'urgent'
} as const;

// Types de accounting_entries
export const TRANSACTION_TYPES = {
  REVENUE: 'revenue',
  EXPENSE: 'expense'
} as const;

// Types d'événements
export const EVENT_TYPES = {
  MEETING: 'meeting',
  TASK: 'task',
  REMINDER: 'reminder',
  OTHER: 'other'
} as const;

// Sources de leads
export const LEAD_SOURCES = {
  WEBSITE: 'website',
  REFERRAL: 'referral',
  SOCIAL: 'social',
  OTHER: 'other'
} as const;

// Catégories de projets
export const PROJECT_CATEGORIES = {
  GENERAL: 'Général',
  WEB_DEV: 'Développement Web',
  MOBILE_DEV: 'Application Mobile',
  DESIGN: 'Design',
  MARKETING: 'Marketing',
  TRAINING: 'Formation'
} as const;

// Couleurs des statuts
export const STATUS_COLORS = {
  [CONTACT_STATUSES.PROSPECT]: 'bg-blue-100 text-blue-800',
  [CONTACT_STATUSES.QUALIFIED]: 'bg-green-100 text-green-800',
  [CONTACT_STATUSES.LOST]: 'bg-red-100 text-red-800',
  [PROJECT_STATUSES.PLANNING]: 'bg-blue-100 text-blue-800',
  [PROJECT_STATUSES.IN_PROGRESS]: 'bg-orange-100 text-orange-800',
  [PROJECT_STATUSES.REVIEW]: 'bg-yellow-100 text-yellow-800',
  [PROJECT_STATUSES.COMPLETED]: 'bg-green-100 text-green-800',
  [PROJECT_STATUSES.ON_HOLD]: 'bg-gray-100 text-gray-800'
} as const;

// Labels des statuts
export const STATUS_LABELS = {
  [CONTACT_STATUSES.PROSPECT]: 'Prospect',
  [CONTACT_STATUSES.QUALIFIED]: 'Qualifié',
  [CONTACT_STATUSES.LOST]: 'Perdu',
  [PROJECT_STATUSES.PLANNING]: 'Planification',
  [PROJECT_STATUSES.IN_PROGRESS]: 'En cours',
  [PROJECT_STATUSES.REVIEW]: 'En révision',
  [PROJECT_STATUSES.COMPLETED]: 'Terminé',
  [PROJECT_STATUSES.ON_HOLD]: 'En pause'
} as const;

// Configuration de l'application
export const APP_CONFIG = {
  NAME: 'CRM Professionnel',
  VERSION: '1.0.0',
  DESCRIPTION: 'Système de gestion de la relation client',
  AUTHOR: 'Équipe de développement'
} as const;

// Configuration des graphiques
export const CHART_COLORS = {
  PRIMARY: '#9334e9',
  SUCCESS: '#10b981',
  WARNING: '#f59e0b',
  DANGER: '#ef4444',
  INFO: '#3b82f6'
} as const;

// Configuration des notifications
export const NOTIFICATION_CONFIG = {
  DURATION: 5000,
  POSITION: 'top-right'
} as const;

// Configuration de la pagination
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE_SIZE: 10,
  PAGE_SIZE_OPTIONS: [5, 10, 20, 50]
} as const;

// Configuration des filtres
export const FILTER_CONFIG = {
  DEFAULT_DATE_RANGE: 30, // jours
  MAX_SEARCH_LENGTH: 100
} as const;

// Permissions des rôles
export const ROLE_PERMISSIONS = {
  admin: {
    canViewDashboard: true,
    canViewLeads: true,
    canViewProjects: true,
    canViewTasks: true,
    canViewChat: true,
    canViewFinance: true,
    canViewSettings: true,
    canEditLeads: true,
    canEditProjects: true,
    canEditTasks: true,
    canEditUsers: true
  },
  user: {
    canViewDashboard: true,
    canViewLeads: true,
    canViewProjects: true,
    canViewTasks: true,
    canViewChat: true,
    canViewFinance: false,
    canViewSettings: false,
    canEditLeads: true,
    canEditProjects: true,
    canEditTasks: true,
    canEditUsers: false
  },
  viewer: {
    canViewDashboard: true,
    canViewLeads: true,
    canViewProjects: true,
    canViewTasks: true,
    canViewChat: false,
    canViewFinance: false,
    canViewSettings: false,
    canEditLeads: false,
    canEditProjects: false,
    canEditTasks: false,
    canEditUsers: false
  }
} as const;