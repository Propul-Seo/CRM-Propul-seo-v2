export interface ContactActivity {
  id: string;
  contact_id: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task';
  title: string;
  description?: string;
  activity_date: string;
  status: 'completed' | 'scheduled' | 'cancelled';
  created_at: string;
}

export interface ContactDetailsProps {
  contactId: string;
  onBack: () => void;
}

export interface ActivityFormState {
  type: ContactActivity['type'];
  title: string;
  description: string;
  activity_date: string;
  status: ContactActivity['status'];
}

export interface EditFormState {
  company_name: string;
  contact_name: string;
  email: string;
  phone: string;
  website: string;
  status: string;
  project_price: number | undefined;
  source: string;
  notes: string;
  assigned_to: string;
  no_show: 'Oui' | 'Non';
}
