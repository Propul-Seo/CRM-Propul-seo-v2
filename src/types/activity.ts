export type ActivityType = 'projet' | 'prospect';

export interface Activity {
  id: string;
  title: string;
  description?: string;
  date_utc: string; // UTC ISO string
  type: ActivityType;
  priority: 'haute' | 'moyenne' | 'basse';
  status: 'a_faire' | 'en_cours' | 'termine';
  related_id: string;
  related_module: 'projet' | 'crm';
  created_at: string;
  updated_at: string;
} 