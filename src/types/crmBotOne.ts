// =====================================================
// TYPES CRM BOT ONE
// =====================================================

// Type pour les données dynamiques d'un record CRM Bot One
export type CRMBotOneRecordData = Record<string, string | number | boolean | null | undefined>;

export interface CRMBotOneRecord {
  id: string;
  user_id: string;
  data: CRMBotOneRecordData;
  created_at: string;
  updated_at: string;
  status: string;
  tags: string[];
  next_activity_date?: string | null;
}

export interface CRMBotOneColumn {
  id: string;
  column_name: string;
  column_type: string;
  is_required: boolean;
  default_value?: string;
  options?: {
    options: string[];
  };
  column_order: number;
  created_at: string;
  updated_at: string;
}

export interface CRMBotOneRecordForm {
  data: CRMBotOneRecordData;
  status: string;
  tags: string[];
  next_activity_date?: string | null;
}

export interface CRMBotOneColumnForm {
  column_name: string;
  column_type: string;
  is_required: boolean;
  default_value?: string;
  options?: {
    options: string[];
  };
}

export interface CRMBotOneFilters {
  status?: string;
  tags?: string[];
  dateFrom?: string;
  dateTo?: string;
  search?: string;
}

export interface CRMBotOneActivity {
  id: string;
  record_id: string;
  title: string;
  description?: string | null;
  activity_date: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task';
  status: 'scheduled' | 'completed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface CRMBotOneStats {
  totalRecords: number;
  recordsByStatus: Record<string, number>;
  recordsByTag: Record<string, number>;
  recentActivity: number;
}

// Types pour les opérations CRUD
export interface CRMBotOneRecordInsert {
  data: CRMBotOneRecordData;
  status?: string;
  tags?: string[];
  next_activity_date?: string | null;
}

export interface CRMBotOneRecordUpdate {
  data?: CRMBotOneRecordData;
  status?: string;
  tags?: string[];
  next_activity_date?: string | null;
}

export interface CRMBotOneColumnInsert {
  column_name: string;
  column_type: string;
  is_required?: boolean;
  default_value?: string;
  options?: {
    options: string[];
  };
  column_order?: number;
}

export interface CRMBotOneColumnUpdate {
  column_name?: string;
  column_type?: string;
  is_required?: boolean;
  default_value?: string;
  options?: {
    options: string[];
  };
  column_order?: number;
}

// Types pour les activités
export interface CRMBotOneActivityForm {
  title: string;
  description?: string;
  activity_date: string;
  type: 'call' | 'email' | 'meeting' | 'note' | 'task';
  status: 'scheduled' | 'completed' | 'cancelled';
}

export interface CRMBotOneActivityUpdate {
  title?: string;
  description?: string;
  activity_date?: string;
  type?: 'call' | 'email' | 'meeting' | 'note' | 'task';
  status?: 'scheduled' | 'completed' | 'cancelled';
}
