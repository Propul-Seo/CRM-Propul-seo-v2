/**
 * propulspace schema — TypeScript types.
 *
 * Generated from `information_schema.columns` on 2026-05-16
 * (live DB introspection — project tbuqctfgjjxnevmsvucl).
 *
 * Why a separate file ? The Supabase MCP can only export `public + v2`
 * types; the propulspace schema must be transcribed manually until we
 * configure a Supabase personal access token + run `supabase gen types`.
 *
 * Regenerate when a migration changes columns in `propulspace.*`:
 *   1. Run the SQL in scripts/gen-propulspace-types.sql (introspection)
 *   2. Update the interfaces below
 *   3. `npx tsc --noEmit` must stay clean
 */

import type { Json } from './database';

// ─── analytics_events ─────────────────────────────────────────────
export interface AnalyticsEventsRow {
  id: number;
  project_id: string | null;
  qualification_lead_id: string | null;
  user_id: string | null;
  event_name: string;
  properties: Json | null;
  session_id: string | null;
  created_at: string | null;
}

// ─── audit_log ────────────────────────────────────────────────────
export interface AuditLogRow {
  id: string;
  project_id: string | null;
  user_id: string | null;
  resource_type: string;
  resource_id: string | null;
  action: string;
  diff: Json | null;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string | null;
}

// ─── documents ────────────────────────────────────────────────────
export interface DocumentsRow {
  id: string;
  project_id: string;
  document_type: string;
  category: string | null;
  name: string;
  description: string | null;
  file_url: string;
  file_size_bytes: number | null;
  file_mime_type: string | null;
  version: number | null;
  parent_document_id: string | null;
  visible_to_client: boolean | null;
  uploaded_by_client: boolean | null;
  viewed_by_client_at: string | null;
  downloaded_by_client_at: string | null;
  uploaded_by: string | null;
  created_at: string | null;
  updated_at: string | null;
  deleted_at: string | null;
}

// ─── docuseal_webhook_events ─────────────────────────────────────
export interface DocusealWebhookEventsRow {
  id: string;
  docuseal_event_id: string;
  event_type: string;
  payload: Json;
  processed: boolean | null;
  processed_at: string | null;
  processing_error: string | null;
  received_at: string | null;
}

// ─── invoice_installments ────────────────────────────────────────
export interface InvoiceInstallmentsRow {
  id: string;
  invoice_id: string;
  installment_number: number;
  label: string | null;
  amount: number;
  due_date: string;
  status: string;
  stripe_payment_link_url: string | null;
  paid_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// ─── invoices ────────────────────────────────────────────────────
export interface InvoicesRow {
  id: string;
  invoice_number: string;
  project_id: string;
  client_snapshot: Json;
  is_deposit: boolean | null;
  amount_subtotal: number;
  vat_rate: number;
  amount_vat: number;
  amount_total: number;
  currency: string | null;
  line_items: Json;
  status: string;
  issue_date: string;
  due_date: string;
  paid_at: string | null;
  stripe_payment_link_url: string | null;
  stripe_payment_link_id: string | null;
  stripe_payment_intent_id: string | null;
  stripe_paid_at: string | null;
  pdf_url: string | null;
  pdf_hash_sha256: string | null;
  internal_notes: string | null;
  client_visible_notes: string | null;
  is_locked: boolean | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// ─── onboarding_responses ────────────────────────────────────────
export interface OnboardingResponsesRow {
  id: string;
  project_id: string;
  inherited_from_qualification_id: string | null;
  detailed_personas: Json | null;
  brand_voice_notes: string | null;
  content_strategy: string | null;
  logo_uploaded: boolean | null;
  charter_uploaded: boolean | null;
  content_uploaded: boolean | null;
  legal_mentions_provided: boolean | null;
  has_provided_google_access: boolean | null;
  has_provided_hosting_access: boolean | null;
  has_provided_dns_access: boolean | null;
  has_provided_social_access: boolean | null;
  access_credentials_vault_id: string | null;
  completion_percent: number | null;
  is_complete: boolean | null;
  completed_at: string | null;
  kickoff_call_scheduled_at: string | null;
  kickoff_call_completed_at: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// ─── project_steps ───────────────────────────────────────────────
export interface ProjectStepsRow {
  id: string;
  project_id: string;
  step_order: number;
  label: string;
  description: string | null;
  status: string;
  date_start: string | null;
  date_planned_end: string | null;
  date_actual_end: string | null;
  visible_to_client: boolean | null;
  created_at: string | null;
  updated_at: string | null;
}

// ─── qualification_leads ─────────────────────────────────────────
export interface QualificationLeadsRow {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  company_name: string | null;
  business_sector: string;
  business_sector_custom: string | null;
  has_existing_site: boolean | null;
  existing_site_url: string | null;
  monthly_traffic: string | null;
  main_problems: string[] | null;
  has_domain_only: boolean | null;
  main_goal: string | null;
  target_audience: string | null;
  competitors: string | null;
  desired_features: string[] | null;
  ecommerce_platform: string | null;
  product_count_range: string | null;
  monthly_orders_range: string | null;
  reservation_type: string | null;
  health_specific_needs: string | null;
  has_visual_identity: string | null;
  wants_identity_creation: boolean | null;
  budget_range: string;
  desired_timeline: string | null;
  timeline_reason: string | null;
  is_decision_maker: string | null;
  preferred_contact_method: string | null;
  final_cta_choice: string | null;
  quality_score: number | null;
  quality_score_breakdown: Json | null;
  status: string;
  draft_progress_percent: number | null;
  converted_to_project_id: string | null;
  user_id: string | null;
  ae_assigned: string | null;
  source: string | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  ip_address: string | null;
  user_agent: string | null;
  pappers_enrichment: Json | null;
  submitted_at: string | null;
  contacted_at: string | null;
  converted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  notes: string | null;
}

// ─── qualification_uploads ───────────────────────────────────────
export interface QualificationUploadsRow {
  id: string;
  qualification_lead_id: string;
  upload_type: string;
  file_url: string;
  file_size_bytes: number | null;
  file_mime_type: string | null;
  original_filename: string | null;
  uploaded_at: string | null;
}

// ─── signatures ──────────────────────────────────────────────────
export interface SignaturesRow {
  id: string;
  project_id: string;
  document_id: string | null;
  signature_type: string;
  name: string;
  signed_pdf_url: string | null;
  signed_name: string | null;
  signer_email: string | null;
  signature_image: string | null;
  consent_at: string | null;
  document_sha256: string | null;
  status: string;
  sent_at: string | null;
  signed_at: string | null;
  expires_at: string | null;
  declined_at: string | null;
  decline_reason: string | null;
  signer_ip: string | null;
  signer_user_agent: string | null;
  created_by: string | null;
  created_at: string | null;
  updated_at: string | null;
}

// ─── stripe_webhook_events ───────────────────────────────────────
export interface StripeWebhookEventsRow {
  id: string;
  stripe_event_id: string;
  event_type: string;
  payload: Json;
  processed: boolean | null;
  processed_at: string | null;
  processing_error: string | null;
  received_at: string | null;
}

// ─── Schema wrapper — Supabase-style ─────────────────────────────
export interface PropulspaceSchema {
  Tables: {
    analytics_events:        { Row: AnalyticsEventsRow };
    audit_log:               { Row: AuditLogRow };
    documents:               { Row: DocumentsRow };
    docuseal_webhook_events: { Row: DocusealWebhookEventsRow };
    invoice_installments:    { Row: InvoiceInstallmentsRow };
    invoices:                { Row: InvoicesRow };
    onboarding_responses:    { Row: OnboardingResponsesRow };
    project_steps:           { Row: ProjectStepsRow };
    qualification_leads:     { Row: QualificationLeadsRow };
    qualification_uploads:   { Row: QualificationUploadsRow };
    signatures:              { Row: SignaturesRow };
    stripe_webhook_events:   { Row: StripeWebhookEventsRow };
  };
}
