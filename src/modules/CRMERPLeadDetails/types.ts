export const CRMERP_STATUSES = [
  'leads_contactes',
  'rendez_vous_effectues',
  'en_attente',
  'signes',
] as const;

export type CRMERPStatus = (typeof CRMERP_STATUSES)[number];

export const CRMERP_STATUS_LABELS: Record<CRMERPStatus, string> = {
  leads_contactes: 'Leads contactés',
  rendez_vous_effectues: 'RDV effectués',
  en_attente: 'En attente',
  signes: 'Signés',
};

export const CRMERP_STATUS_COLORS: Record<CRMERPStatus, { bg: string; header: string; badge: string }> = {
  leads_contactes: { bg: 'bg-blue-500/10 border-blue-500/20', header: 'bg-blue-600', badge: 'bg-blue-500/15 text-blue-400' },
  rendez_vous_effectues: { bg: 'bg-orange-500/10 border-orange-500/20', header: 'bg-orange-600', badge: 'bg-orange-500/15 text-orange-400' },
  en_attente: { bg: 'bg-surface-2/50 border-border', header: 'bg-surface-3', badge: 'bg-surface-2/50 text-foreground' },
  signes: { bg: 'bg-green-500/10 border-green-500/20', header: 'bg-green-600', badge: 'bg-green-500/15 text-green-400' },
};

export interface CRMERPLead {
  id: string;
  created_at: string;
  updated_at: string;
  company_name: string | null;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  source: string | null;
  status: CRMERPStatus;
  assignee_id: string | null;
  notes: string | null;
  last_activity_at: string | null;
  assignee?: { id: string; name: string; email: string; is_active?: boolean } | null;
}

export type ActivityType = 'call' | 'email' | 'meeting' | 'note' | 'task';

export interface CRMERPActivity {
  id: string;
  created_at: string;
  lead_id: string;
  type: ActivityType;
  content: string | null;
  created_by: string | null;
  metadata: Record<string, unknown>;
  creator?: { id: string; name: string } | null;
}

export interface CRMERPLeadFormData {
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  source: string;
  status: CRMERPStatus;
  assignee_id: string;
  notes: string;
}

export const INITIAL_LEAD_FORM: CRMERPLeadFormData = {
  company_name: '',
  contact_name: '',
  email: '',
  phone: '',
  source: '',
  status: 'leads_contactes',
  assignee_id: '',
  notes: '',
};

export const ACTIVITY_TYPES: { value: ActivityType; label: string }[] = [
  { value: 'call', label: 'Appel' },
  { value: 'email', label: 'Email' },
  { value: 'meeting', label: 'Rendez-vous' },
  { value: 'note', label: 'Note' },
  { value: 'task', label: 'Tâche' },
];
