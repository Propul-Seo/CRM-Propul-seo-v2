export type ActivityType = 'call' | 'meeting' | 'email' | 'follow_up' | 'demo' | 'proposal' | 'note' | 'reminder' | 'other';
export type ActivityPriority = 'low' | 'medium' | 'high';
export type ActivityStatus = 'pending' | 'completed' | 'cancelled';

// Labels français pour les types d'activités
export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  call: '📞 Appel téléphonique',
  meeting: '📅 Rendez-vous',
  email: '📧 Email de suivi',
  follow_up: '🔄 Relance',
  demo: '💻 Démonstration',
  proposal: '📋 Proposition',
  note: '📝 Note/Mémo',
  reminder: '⏰ Rappel',
  other: '📌 Autre'
};

// Labels français pour les priorités
export const ACTIVITY_PRIORITY_LABELS: Record<ActivityPriority, string> = {
  high: '🔴 Haute',
  medium: '🟡 Moyenne',
  low: '🟢 Basse'
};

// Labels français pour les statuts
export const ACTIVITY_STATUS_LABELS: Record<ActivityStatus, string> = {
  pending: '⏳ Programmé',
  completed: '✅ Terminé',
  cancelled: '❌ Annulé'
};

// Couleurs pour les types d'activités
export const ACTIVITY_TYPE_COLORS: Record<ActivityType, string> = {
  call: 'bg-blue-900/30 text-blue-300',
  meeting: 'bg-green-900/30 text-green-300',
  email: 'bg-purple-900/30 text-purple-300',
  follow_up: 'bg-orange-900/30 text-orange-300',
  demo: 'bg-indigo-900/30 text-indigo-300',
  proposal: 'bg-yellow-900/30 text-yellow-300',
  note: 'bg-surface-3 text-muted-foreground',
  reminder: 'bg-red-900/30 text-red-300',
  other: 'bg-surface-3 text-muted-foreground'
};

// Couleurs pour les priorités
export const ACTIVITY_PRIORITY_COLORS: Record<ActivityPriority, string> = {
  high: 'bg-red-900/30 text-red-300',
  medium: 'bg-yellow-900/30 text-yellow-300',
  low: 'bg-green-900/30 text-green-300'
};

// Couleurs pour les statuts (avec support dark mode)
export const ACTIVITY_STATUS_COLORS: Record<ActivityStatus, string> = {
  pending: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
  completed: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
  cancelled: 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-300'
};

export interface ProspectActivity {
  id: string;
  prospect_id: string;
  title: string;
  description?: string;
  activity_date: string; // ISO string
  activity_type: ActivityType;
  priority: ActivityPriority;
  status: ActivityStatus;
  assigned_to?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProspectActivityData {
  prospect_id: string;
  title: string;
  description?: string;
  activity_date: string;
  activity_type: ActivityType;
  priority?: ActivityPriority;
  status?: ActivityStatus;
  assigned_to?: string;
  created_by: string;
}

export interface UpdateProspectActivityData {
  title?: string;
  description?: string;
  activity_date?: string;
  activity_type?: ActivityType;
  priority?: ActivityPriority;
  status?: ActivityStatus;
  assigned_to?: string;
} 