// =====================================================
// TYPES DÉRIVÉS DE SUPABASE - ALIASES POUR FACILITER L'USAGE
// =====================================================

import { Database } from './database';

// ===== TYPES ROW (lecture depuis la BDD) =====
export type UserProfileRow = Database['public']['Tables']['user_profiles']['Row'];
export type ClientRow = Database['public']['Tables']['clients']['Row'];
export type ProjectRow = Database['public']['Tables']['projects']['Row'];
export type TaskRow = Database['public']['Tables']['tasks']['Row'];
export type CalendarEventRow = Database['public']['Tables']['calendar_events']['Row'];
export type QuoteRow = Database['public']['Tables']['quotes']['Row'];
export type QuoteItemRow = Database['public']['Tables']['quote_items']['Row'];
export type CampaignRow = Database['public']['Tables']['campaigns']['Row'];
export type CampaignMetricRow = Database['public']['Tables']['campaign_metrics']['Row'];
export type LeadRow = Database['public']['Tables']['leads']['Row'];
export type LeadNoteRow = Database['public']['Tables']['lead_notes']['Row'];
export type AccountingEntryRow = Database['public']['Tables']['accounting_entries']['Row'];
export type ActivityRow = Database['public']['Tables']['activities']['Row'];
export type ProspectActivityRow = Database['public']['Tables']['prospect_activities']['Row'];

// ===== TYPES INSERT (création dans la BDD) =====
export type UserProfileInsert = Database['public']['Tables']['user_profiles']['Insert'];
export type ClientInsert = Database['public']['Tables']['clients']['Insert'];
export type ProjectInsert = Database['public']['Tables']['projects']['Insert'];
export type TaskInsert = Database['public']['Tables']['tasks']['Insert'];
export type CalendarEventInsert = Database['public']['Tables']['calendar_events']['Insert'];
export type QuoteInsert = Database['public']['Tables']['quotes']['Insert'];
export type QuoteItemInsert = Database['public']['Tables']['quote_items']['Insert'];
export type CampaignInsert = Database['public']['Tables']['campaigns']['Insert'];
export type CampaignMetricInsert = Database['public']['Tables']['campaign_metrics']['Insert'];
export type LeadInsert = Database['public']['Tables']['leads']['Insert'];
export type LeadNoteInsert = Database['public']['Tables']['lead_notes']['Insert'];
export type AccountingEntryInsert = Database['public']['Tables']['accounting_entries']['Insert'];
export type ActivityInsert = Database['public']['Tables']['activities']['Insert'];
export type ProspectActivityInsert = Database['public']['Tables']['prospect_activities']['Insert'];

// ===== TYPES UPDATE (mise à jour dans la BDD) =====
export type UserProfileUpdate = Database['public']['Tables']['user_profiles']['Update'];
export type ClientUpdate = Database['public']['Tables']['clients']['Update'];
export type ProjectUpdate = Database['public']['Tables']['projects']['Update'];
export type TaskUpdate = Database['public']['Tables']['tasks']['Update'];
export type CalendarEventUpdate = Database['public']['Tables']['calendar_events']['Update'];
export type QuoteUpdate = Database['public']['Tables']['quotes']['Update'];
export type QuoteItemUpdate = Database['public']['Tables']['quote_items']['Update'];
export type CampaignUpdate = Database['public']['Tables']['campaigns']['Update'];
export type CampaignMetricUpdate = Database['public']['Tables']['campaign_metrics']['Update'];
export type LeadUpdate = Database['public']['Tables']['leads']['Update'];
export type LeadNoteUpdate = Database['public']['Tables']['lead_notes']['Update'];
export type AccountingEntryUpdate = Database['public']['Tables']['accounting_entries']['Update'];
export type ActivityUpdate = Database['public']['Tables']['activities']['Update'];
export type ProspectActivityUpdate = Database['public']['Tables']['prospect_activities']['Update'];

// ===== ENUMS =====
export type UserRole = Database['public']['Enums']['user_role'];
export type ClientStatus = Database['public']['Enums']['client_status'];
export type TaskStatus = Database['public']['Enums']['task_status'];
export type TaskPriority = Database['public']['Enums']['task_priority'];
export type ProjectStatus = Database['public']['Enums']['project_status'];
export type EventType = Database['public']['Enums']['event_type'];
export type QuoteStatus = Database['public']['Enums']['quote_status'];

// ===== TYPES POUR LES CONTACTS (table principale du CRM) =====
// Note: La table "contacts" n'est pas dans database.ts,
// mais est utilisée dans le code. Définition basée sur l'usage.
export interface ContactRow {
  id: string;
  name: string;
  company: string;
  email: string;
  phone: string | null;
  website: string | null;
  status: 'prospect' | 'contacted' | 'qualified' | 'proposal' | 'negotiation' | 'won' | 'lost';
  source: string;
  project_price: number | null;
  total_revenue: number | null;
  notes: string[] | null;
  assigned_to: string | null;
  assigned_user?: {
    id: string;
    name: string;
    email: string;
    is_active?: boolean;
  } | null;
  assigned_user_name?: string | null;
  next_activity_date: string | null;
  user_id: string;
  created_at: string;
  updated_at: string;
}

export interface ContactInsert {
  id?: string;
  name: string;
  company: string;
  email: string;
  phone?: string | null;
  website?: string | null;
  status?: ContactRow['status'];
  source?: string;
  project_price?: number | null;
  notes?: string[] | null;
  assigned_to?: string | null;
  next_activity_date?: string | null;
  user_id: string;
}

export interface ContactUpdate {
  name?: string;
  company?: string;
  email?: string;
  phone?: string | null;
  website?: string | null;
  status?: ContactRow['status'];
  source?: string;
  project_price?: number | null;
  total_revenue?: number | null;
  notes?: string[] | null;
  assigned_to?: string | null;
  next_activity_date?: string | null;
}

// ===== TYPES POUR LES CHANNELS (Chat) =====
export interface ChannelRow {
  id: string;
  name: string;
  description: string | null;
  is_private: boolean;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface ChannelInsert {
  id?: string;
  name: string;
  description?: string | null;
  is_private?: boolean;
  created_by: string;
}

export interface ChannelUpdate {
  name?: string;
  description?: string | null;
  is_private?: boolean;
}

// ===== TYPES POUR LES MESSAGES (Chat) =====
export interface MessageRow {
  id: string;
  channel_id: string;
  user_id: string;
  content: string;
  created_at: string;
  updated_at: string;
  users?: {
    name: string;
    email: string;
  };
}

export interface MessageInsert {
  id?: string;
  channel_id: string;
  user_id: string;
  content: string;
}

export interface MessageUpdate {
  content?: string;
}

// ===== TYPES POUR LES POSTS (Communication) =====
export type PostType = 'agence' | 'perso' | 'client' | 'informatif';
export type PostPlatform = 'linkedin' | 'instagram' | 'newsletter' | 'multi';
export type PostStatus = 'idea' | 'drafting' | 'review' | 'scheduled' | 'published';

export interface PostRow {
  id: string;
  title: string;
  type: PostType;
  platform: PostPlatform;
  status: PostStatus;
  strategic_angle: string | null;
  hook: string | null;
  content: string | null;
  objective: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  responsible_user_id: string | null;
  client_id: string | null;
  external_url: string | null;
  external_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface PostInsert {
  id?: string;
  title: string;
  type: PostType;
  platform: PostPlatform;
  status?: PostStatus;
  strategic_angle?: string | null;
  hook?: string | null;
  content?: string | null;
  objective?: string | null;
  scheduled_at?: string | null;
  published_at?: string | null;
  responsible_user_id?: string | null;
  client_id?: string | null;
  external_url?: string | null;
  external_id?: string | null;
}

export interface PostUpdate {
  title?: string;
  type?: PostType;
  platform?: PostPlatform;
  status?: PostStatus;
  strategic_angle?: string | null;
  hook?: string | null;
  content?: string | null;
  objective?: string | null;
  scheduled_at?: string | null;
  published_at?: string | null;
  responsible_user_id?: string | null;
  client_id?: string | null;
  external_url?: string | null;
  external_id?: string | null;
}

export interface PostAssetRow {
  id: string;
  post_id: string;
  asset_url: string | null;
  storage_path: string | null;
  asset_type: 'image' | 'video' | 'document';
  file_name: string | null;
  created_at: string;
}

export interface PostCommentRow {
  id: string;
  post_id: string;
  author_id: string;
  comment: string;
  created_at: string;
  author?: {
    name: string;
    email: string;
  };
}

// ============================================
// Post Metrics
// ============================================
export interface PostMetricsRow {
  id: string;
  post_id: string;
  impressions: number;
  reach: number;
  engagement: number;
  clicks: number;
  shares: number;
  comments_count: number;
  saves: number;
  leads_count: number;
  revenue: number;
  engagement_rate: number;
  performance_score: number;
  source: 'manual' | 'linkedin_api' | 'meta_api';
  measured_at: string;
  created_at: string;
  updated_at: string;
}

export interface PostMetricsInsert {
  post_id: string;
  impressions?: number;
  reach?: number;
  engagement?: number;
  clicks?: number;
  shares?: number;
  comments_count?: number;
  saves?: number;
  leads_count?: number;
  revenue?: number;
  source?: 'manual' | 'linkedin_api' | 'meta_api';
}

export interface PostMetricsUpdate {
  impressions?: number;
  reach?: number;
  engagement?: number;
  clicks?: number;
  shares?: number;
  comments_count?: number;
  saves?: number;
  leads_count?: number;
  revenue?: number;
  source?: 'manual' | 'linkedin_api' | 'meta_api';
}

// ============================================
// Social Connections (OAuth tokens)
// ============================================
export interface SocialConnectionRow {
  id: string;
  platform: 'linkedin' | 'instagram';
  account_type: 'company' | 'creator';
  account_name: string;
  account_id: string | null;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string;
  connected_by: string | null;
  last_sync_at: string | null;
  sync_status: 'active' | 'error' | 'expired';
  created_at: string;
  updated_at: string;
}

// ============================================
// KPI View Types (materialized views)
// ============================================
export interface KPIMonthlyOverview {
  month: string;
  platform: string;
  type: string;
  responsible_user_id: string | null;
  posts_count: number;
  total_impressions: number;
  total_reach: number;
  total_engagement: number;
  total_clicks: number;
  total_leads: number;
  total_revenue: number;
  avg_engagement_rate: number;
  avg_performance_score: number;
  roi_per_post: number;
}

export interface KPIDailyMetrics {
  day: string;
  platform: string;
  type: string;
  posts_count: number;
  impressions: number;
  reach: number;
  engagement: number;
  avg_engagement_rate: number;
  leads_count: number;
  revenue: number;
}

export interface KPITopPost {
  id: string;
  title: string;
  platform: string;
  type: string;
  responsible_user_id: string | null;
  published_at: string;
  impressions: number;
  engagement: number;
  engagement_rate: number;
  leads_count: number;
  revenue: number;
  performance_score: number;
}

// ===== TYPES POUR LES CLIENT POSTS (Communication Clients) =====
export interface ClientPostRow {
  id: string;
  title: string;
  type: PostType;
  platform: PostPlatform;
  status: PostStatus;
  strategic_angle: string | null;
  hook: string | null;
  content: string | null;
  objective: string | null;
  scheduled_at: string | null;
  published_at: string | null;
  responsible_user_id: string | null;
  client_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface ClientPostInsert {
  id?: string;
  title: string;
  type: PostType;
  platform: PostPlatform;
  status?: PostStatus;
  strategic_angle?: string | null;
  hook?: string | null;
  content?: string | null;
  objective?: string | null;
  scheduled_at?: string | null;
  published_at?: string | null;
  responsible_user_id?: string | null;
  client_id?: string | null;
}

export interface ClientPostUpdate {
  title?: string;
  type?: PostType;
  platform?: PostPlatform;
  status?: PostStatus;
  strategic_angle?: string | null;
  hook?: string | null;
  content?: string | null;
  objective?: string | null;
  scheduled_at?: string | null;
  published_at?: string | null;
  responsible_user_id?: string | null;
  client_id?: string | null;
}

export interface ClientPostAssetRow {
  id: string;
  post_id: string;
  asset_url: string | null;
  storage_path: string | null;
  asset_type: 'image' | 'video' | 'document';
  file_name: string | null;
  created_at: string;
}

export interface ClientPostCommentRow {
  id: string;
  post_id: string;
  author_id: string;
  comment: string;
  created_at: string;
  author?: {
    name: string;
    email: string;
  };
}

// ===== TYPES POUR LES RÉSULTATS D'API =====
export interface CRUDResult<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ===== TYPES POUR LES FILTRES =====
export interface SupabaseFilters {
  [key: string]: string | number | boolean | null | undefined;
}

// ===== TYPE POUR LES PAYLOADS REALTIME =====
export interface RealtimePayload<T> {
  commit_timestamp: string;
  errors: string[] | null;
  eventType: 'INSERT' | 'UPDATE' | 'DELETE';
  new: T;
  old: Partial<T>;
  schema: string;
  table: string;
}
