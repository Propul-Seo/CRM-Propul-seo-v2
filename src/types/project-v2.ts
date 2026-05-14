// ============================================================
// TYPES V2 — Gestion de projets
// Ne pas modifier database.ts — tous les types V2 sont ici
// ============================================================

// ===== STATUTS =====

export type ProjectStatusV2 =
  | 'prospect'
  | 'brief_received'
  | 'quote_sent'
  | 'in_progress'
  | 'review'
  | 'delivered'
  | 'maintenance'
  | 'on_hold'
  | 'closed'

export type PrestaType = 'web' | 'seo' | 'erp' | 'saas' | 'site_web' | 'erp_v2' | 'communication'

// ===== PROJET ÉTENDU =====

export interface ProjectV2 {
  id: string
  user_id: string | null
  client_id: string | null
  client_name?: string | null
  name: string
  description: string | null
  status: ProjectStatusV2
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to: string | null
  assigned_name?: string | null
  start_date: string
  end_date: string | null
  budget: number | null
  progress: number
  category: string
  presta_type: PrestaType[]
  completion_score: number
  last_activity_at: string | null
  completed_at: string | null
  is_archived: boolean
  next_action_label: string | null
  next_action_due: string | null
  siret: string | null
  company_data: Record<string, unknown> | null
  company_enriched_at: string | null
  // === RÉSUMÉ IA ===
  ai_summary: { situation: string; action: string; milestone: string } | null
  ai_summary_generated_at: string | null
  // === PORTAIL CLIENT ===
  portal_token: string | null
  portal_enabled: boolean
  portal_short_code?: string | null
  portal_expires_at?: string | null
  // === BRIEF TOKEN ===
  brief_token: string | null
  brief_token_enabled: boolean
  brief_short_code?: string | null
  // === STATUTS MODULE ===
  sw_status?: StatusSiteWeb | null
  erp_status?: StatusERP | null
  comm_status?: StatusComm | null
  created_at: string
  updated_at: string
}

// ===== CHECKLIST V2 =====

export type ChecklistPhase =
  | 'onboarding'
  | 'conception'
  | 'developpement'
  | 'recette'
  | 'post_livraison'
  | 'general'

export type ChecklistStatus = 'todo' | 'in_progress' | 'done' | 'skipped'

export interface ChecklistItemV2 {
  id: string
  project_id: string
  template_id?: string | null
  parent_task_id?: string | null
  title: string
  description?: string | null
  phase: ChecklistPhase
  status: ChecklistStatus
  priority: 'low' | 'medium' | 'high' | 'urgent'
  assigned_to?: string | null
  assigned_name?: string | null
  due_date?: string | null
  completed_at?: string | null
  estimated_hours?: number | null
  actual_hours?: number | null
  position: number
  created_at: string
  updated_at: string
}

// ===== JOURNAL / TIMELINE =====

export type ActivityType =
  | 'email'
  | 'call'
  | 'meeting'
  | 'decision'
  | 'task'
  | 'file'
  | 'access'
  | 'status'
  | 'invoice'
  | 'system'

export interface ProjectActivity {
  id: string
  project_id: string
  user_id?: string | null
  author_name?: string | null
  type: ActivityType
  content: string
  is_auto: boolean
  metadata?: Record<string, unknown>
  created_at: string
}

// ===== COFFRE-FORT ACCÈS =====

export type AccessCategory =
  | 'hosting'
  | 'cms'
  | 'analytics'
  | 'social'
  | 'tools'
  | 'design'

export type AccessStatus =
  | 'active'
  | 'missing'
  | 'broken'
  | 'expired'
  | 'pending_validation'

export interface ProjectAccess {
  id: string
  project_id: string
  category: AccessCategory
  service_name: string
  url?: string | null
  login: string
  password: string
  notes?: string | null
  status: AccessStatus
  detected_from_email: boolean
  created_at: string
  updated_at: string
}

// ===== DOCUMENTS =====

export type DocumentCategory =
  | 'contract'
  | 'brief'
  | 'mockup'
  | 'report'
  | 'deliverable'
  | 'invoice'
  | 'other'

export interface ProjectDocument {
  id: string
  project_id: string
  name: string
  category: DocumentCategory
  version: number
  file_path: string
  file_size?: number | null
  mime_type?: string | null
  uploaded_by?: string | null
  uploader_name?: string | null
  created_at: string
}

// ===== BRIEF =====

export type BriefStatus = 'draft' | 'submitted' | 'validated' | 'frozen'

export interface ProjectBrief {
  id: string
  project_id: string
  objective?: string | null
  target_audience?: string | null
  pages?: string | null
  techno?: string | null
  design_references?: string | null
  notes?: string | null
  submitted_at?: string | null
  status: BriefStatus
  created_at: string
  updated_at: string
}

// ===== BRIEF SITE WEB =====
export type PackSiteWeb = 'starter' | 'professionnel' | 'entreprise' | 'sur_mesure'
export type NiveauSEO = 'basique' | 'avance' | 'premium'

export interface BriefSiteWeb {
  id: string
  project_id: string
  pack: PackSiteWeb
  nb_pages: number | null
  budget: number | null
  niveau_seo: NiveauSEO
  url_site: string | null
  plateforme: string | null
  status: BriefStatus
  created_at: string
  updated_at: string
}

// ===== BRIEF ERP =====
export type ModuleERP =
  | 'gestion_commerciale'
  | 'crm_suivi'
  | 'gestion_projets'
  | 'stocks_logistique'
  | 'suivi_financier'
  | 'multi_utilisateurs'
  | 'tableaux_bord'
  | 'connexions_api'
  | 'sur_mesure'

export interface BriefERP {
  id: string
  project_id: string
  modules: ModuleERP[]
  nb_utilisateurs: number | null
  budget: number | null
  outils_integres: string | null
  url_deploiement: string | null
  status: BriefStatus
  created_at: string
  updated_at: string
}

// ===== BRIEF COMMUNICATION =====
export type TypeContratComm = 'abonnement' | 'branding' | 'photos_videos'
export type PackComm = 'starter' | 'premium' | 'excellence'
export type PlateformeComm = 'instagram' | 'linkedin' | 'multi'

export interface BriefComm {
  id: string
  project_id: string
  type_contrat: TypeContratComm
  pack: PackComm | null
  nb_posts_mois: number | null
  nb_reels_mois: number | null
  nb_templates: number | null
  plateforme: PlateformeComm | null
  date_debut: string | null
  date_renouvellement: string | null
  mrr: number | null
  budget: number | null
  date_livraison: string | null
  status: BriefStatus
  created_at: string
  updated_at: string
}

// ===== CYCLES MENSUELS COMMUNICATION (V1 — compat mock) =====
export type CycleStatus = 'en_cours' | 'termine'

export interface CommMonthlyCycle {
  id: string
  project_id: string
  mois: string
  label: string
  status: CycleStatus
  created_at: string
}

export interface CommCycleTask {
  id: string
  cycle_id: string
  project_id: string
  title: string
  done: boolean
  sort_order: number
}

// ===== CYCLES MENSUELS COMMUNICATION (V2) =====
export type CommCycleStatus = 'planning' | 'in_progress' | 'review' | 'completed'

export interface CommCycle {
  id: string
  project_id: string
  month: number
  year: number
  status: CommCycleStatus
  objectives?: string | null
  notes?: string | null
  created_at: string
  updated_at: string
}

// ===== POSTS RÉSEAUX SOCIAUX =====
export type CommPostPlatform = 'instagram' | 'linkedin' | 'facebook' | 'tiktok'
export type CommPostType = 'image' | 'carousel' | 'reel' | 'story' | 'article'
export type CommPostStatus = 'draft' | 'ready' | 'scheduled' | 'published'

export interface CommPost {
  id: string
  project_id: string
  cycle_id?: string | null
  platform: CommPostPlatform
  post_type?: CommPostType | null
  caption?: string | null
  hashtags?: string[] | null
  media_urls?: string[] | null
  scheduled_at?: string | null
  published_at?: string | null
  status: CommPostStatus
  notes?: string | null
  created_at: string
  updated_at: string
}

// ===== STATUTS KANBAN PAR MODULE =====
export type StatusSiteWeb =
  | 'prospect'
  | 'devis_envoye'
  | 'signe'
  | 'en_production'
  | 'livre'
  | 'perdu'

export type StatusERP =
  | 'prospect'
  | 'analyse_besoins'
  | 'devis_envoye'
  | 'signe'
  | 'en_developpement'
  | 'recette'
  | 'livre'
  | 'perdu'

export type StatusComm =
  | 'prospect'
  | 'brief_creatif'
  | 'devis_envoye'
  | 'signe'
  | 'en_production'
  | 'actif'
  | 'termine'
  | 'perdu'

// ===== TEMPLATES CHECKLIST =====

export interface ChecklistTemplate {
  id: string
  name: string
  presta_type: string
  phase: ChecklistPhase
  title: string
  description?: string | null
  priority: 'low' | 'medium' | 'high' | 'urgent'
  estimated_hours?: number | null
  position: number
  is_active: boolean
  created_at: string
  created_by?: string | null
}

/** @deprecated Utiliser ChecklistTemplate */
export interface TaskTemplate {
  id: string
  project_type: PrestaType
  phase: ChecklistPhase
  title: string
  default_priority: 'low' | 'medium' | 'high'
  sort_order: number
}

// ===== NOTIFICATIONS =====

export type NotificationType =
  | 'brief_received'
  | 'invoice_overdue'
  | 'task_assigned'
  | 'milestone_reached'
  | 'access_expired'
  | 'status_changed'

export interface ProjectNotification {
  id: string
  user_id: string
  project_id?: string | null
  type: NotificationType | string
  title: string
  message?: string | null
  is_read: boolean
  link?: string | null
  created_at: string
}

// ===== KANBAN =====

export interface KanbanColumnV2 {
  id: ProjectStatusV2
  title: string
  color: string
  headerColor: string
  icon: string // lucide icon name
}

export interface PipelineRule {
  to: ProjectStatusV2
  condition: string
  errorMessage: string
}

// ===== SCORE DE COMPLÉTUDE =====

export interface CompletionWeights {
  checklist: number    // 60%
  brief: number        // 10%
  accesses: number     // 10%
  timeline: number     // 10%
  budget: number       // 10%
}

export interface CompletionData {
  checklistTotal: number
  checklistDone: number
  hasBrief: boolean
  activeAccesses: number
  totalAccesses: number
  timelineEntries: number
  hasBudget: boolean
}

// ===== SUIVI DU DOSSIER =====

export type FollowUpType = 'rdv' | 'appel' | 'email' | 'autre'

export interface FollowUpEntry {
  id: string
  project_id: string
  type: FollowUpType
  date: string
  summary: string
  follow_up_action: string | null
  follow_up_date: string | null
  follow_up_done: boolean
  assigned_to: string | null
  assigned_name: string | null
  created_at: string
}

// ===== TÂCHES COMMUNICATION =====

export type CommTaskStatus   = 'todo' | 'in_progress' | 'review' | 'done'
export type CommTaskPriority = 'low' | 'medium' | 'high' | 'urgent' | 'faible' | 'moyenne' | 'haute' | 'critique'
export type CommTaskCategory = 'creation' | 'shooting' | 'montage' | 'redaction' | 'publication'

export interface CommTask {
  id: string
  project_id: string
  cycle_id?: string | null
  title: string
  description?: string | null
  status: CommTaskStatus
  priority: CommTaskPriority
  assigned_to?: string | null
  due_date?: string | null
  due_hour?: string | null
  category?: CommTaskCategory | null
  post_id?: string | null
  position: number
  // Champs calculés / joints
  project_name?: string
  project_color?: string
  created_at: string
  updated_at: string
}

// ===== FACTURATION ENRICHIE =====

export type InvoiceStatus = 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
export type PaymentMethod = 'virement' | 'cb' | 'cheque'

export interface InvoiceV2 {
  id: string
  project_id: string
  title: string
  invoice_number?: string | null
  amount: number
  tax_rate: number
  amount_ttc?: number | null
  status: InvoiceStatus
  due_date?: string | null
  paid_at?: string | null
  paid_amount?: number | null
  payment_method?: PaymentMethod | null
  notes?: string | null
  pdf_url?: string | null
  created_at: string
  updated_at: string
}

// ===== JALONS DE PAIEMENT =====

export type MilestoneStatus = 'pending' | 'invoiced' | 'paid'

export interface PaymentMilestone {
  id: string
  project_id: string
  label: string
  percentage: number
  amount?: number | null
  invoice_id?: string | null
  status: MilestoneStatus
  trigger_phase?: string | null
  due_date?: string | null
  position: number
  created_at: string
  updated_at: string
}

// ===== BIBLIOTHÈQUE DE FEATURES =====

export interface FeatureTemplate {
  id: string
  name: string
  description?: string | null
  category: string
  subcategory?: string | null
  code_snippet?: string | null
  repo_url?: string | null
  tech_stack?: string[] | null
  estimated_hours?: number | null
  price?: number | null
  is_active: boolean
  created_at: string
  updated_at: string
  created_by?: string | null
}

export type ProjectFeatureStatus = 'planned' | 'in_progress' | 'done' | 'cancelled'

export interface ProjectFeature {
  id: string
  project_id: string
  template_id: string
  status: ProjectFeatureStatus
  custom_price?: number | null
  custom_hours?: number | null
  notes?: string | null
  completed_at?: string | null
  created_at: string
  updated_at: string
  // Joint
  template?: FeatureTemplate | null
}

// ===== AUDIT LOGS =====

export type AuditAction = 'insert' | 'update' | 'delete'

export interface AuditLog {
  id: string
  user_id?: string | null
  project_id?: string | null
  table_name: string
  record_id: string
  action: AuditAction
  old_data?: Record<string, unknown> | null
  new_data?: Record<string, unknown> | null
  ip_address?: string | null
  created_at: string
}

// ===== KPI VUES MATÉRIALISÉES =====

export interface KpiOverview {
  total_ca: number | null
  mrr_comm: number | null
  ca_siteweb: number | null
  ca_erp: number | null
  projects_active: number
  projects_delivered: number
  invoices_pending: number
  invoices_overdue: number
  completion_avg: number | null
  refreshed_at: string
}

export interface KpiMonthly {
  month: number
  year: number
  ca_siteweb: number | null
  ca_erp: number | null
  ca_comm: number | null
  new_projects: number
  delivered_projects: number
  refreshed_at: string
}

// ===== PROJECT CONTACTS (multi-contacts par projet) =====

/**
 * Rôle d'un contact dans un projet.
 * - primary : interlocuteur principal (un seul par projet, contrainte BDD)
 * - decision_maker : décideur côté client
 * - technical : référent technique/IT
 * - billing : référent comptabilité/facturation
 * - other : autre
 */
export type ProjectContactRole = 'primary' | 'decision_maker' | 'technical' | 'billing' | 'other'

export const PROJECT_CONTACT_ROLE_LABELS: Record<ProjectContactRole, string> = {
  primary:        'Principal',
  decision_maker: 'Décideur',
  technical:      'Technique',
  billing:        'Comptabilité',
  other:          'Autre',
}

/** Liaison projet ↔ contact dans la table de liaison `project_contacts`. */
export interface ProjectContact {
  id: string
  project_id: string
  contact_id: string
  role: ProjectContactRole
  notes: string | null
  created_at: string
  updated_at: string
}

/** Payload pour créer une liaison (INSERT). */
export interface ProjectContactInsert {
  project_id: string
  contact_id: string
  role?: ProjectContactRole
  notes?: string | null
}

/** Payload pour mettre à jour une liaison (UPDATE). */
export interface ProjectContactUpdate {
  role?: ProjectContactRole
  notes?: string | null
}

/** Vue enrichie : liaison + coordonnées du contact (via JOIN). */
export interface ProjectContactWithDetails extends ProjectContact {
  contact: {
    id: string
    name: string
    email: string | null
    phone: string | null
    company: string | null
  }
}
