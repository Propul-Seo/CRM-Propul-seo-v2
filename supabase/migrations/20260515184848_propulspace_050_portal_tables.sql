-- ⚠️ MIGRATION HISTORIQUE — DÉJÀ APPLIQUÉE EN PROD
-- Versionnée a posteriori le 2026-05-17 pour combler le drift repo/prod.
-- Source : supabase_migrations.schema_migrations (project ERP, tbuqctfgjjxnevmsvucl).
-- Ne PAS rejouer sur la prod existante.
-- Pour env neuf uniquement (clone + supabase db reset).

-- ============================================================================
-- Migration 050 — Portal tables
-- project_steps, documents (GED), invoices (FR-compliant), invoice_installments,
-- signatures (DocuSeal), onboarding_responses
-- Audit triggers attached to documents, invoices, signatures (sensitive)
-- ============================================================================

CREATE TABLE IF NOT EXISTS propulspace.project_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects_v2(id) ON DELETE CASCADE,
  step_order INTEGER NOT NULL,
  label TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed', 'blocked')),
  date_start DATE,
  date_planned_end DATE,
  date_actual_end DATE,
  visible_to_client BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_steps_project ON propulspace.project_steps(project_id, step_order);

CREATE TABLE IF NOT EXISTS propulspace.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects_v2(id) ON DELETE CASCADE,
  document_type TEXT NOT NULL CHECK (document_type IN (
    'quote', 'contract', 'invoice', 'deliverable', 'audit', 'report',
    'asset_logo', 'asset_charter', 'asset_content', 'asset_access', 'legal', 'other'
  )),
  category TEXT,
  name TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  file_mime_type TEXT,
  version INTEGER DEFAULT 1,
  parent_document_id UUID REFERENCES propulspace.documents(id) ON DELETE SET NULL,
  visible_to_client BOOLEAN DEFAULT true,
  uploaded_by_client BOOLEAN DEFAULT false,
  viewed_by_client_at TIMESTAMPTZ,
  downloaded_by_client_at TIMESTAMPTZ,
  uploaded_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ
);
CREATE INDEX IF NOT EXISTS idx_documents_project ON propulspace.documents(project_id, document_type, created_at DESC) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_documents_visible ON propulspace.documents(project_id, visible_to_client) WHERE deleted_at IS NULL;

DROP TRIGGER IF EXISTS audit_documents ON propulspace.documents;
CREATE TRIGGER audit_documents
  AFTER INSERT OR UPDATE OR DELETE ON propulspace.documents
  FOR EACH ROW EXECUTE FUNCTION propulspace.audit_trigger_fn();

CREATE TABLE IF NOT EXISTS propulspace.invoices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number TEXT UNIQUE NOT NULL,
  project_id UUID NOT NULL REFERENCES public.projects_v2(id),
  client_snapshot JSONB NOT NULL,
  is_deposit BOOLEAN DEFAULT false,
  amount_subtotal NUMERIC(10,2) NOT NULL,
  vat_rate NUMERIC(5,2) NOT NULL DEFAULT 0,
  amount_vat NUMERIC(10,2) NOT NULL DEFAULT 0,
  amount_total NUMERIC(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  line_items JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'paid', 'overdue', 'cancelled', 'refunded')),
  issue_date DATE NOT NULL DEFAULT CURRENT_DATE,
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  stripe_payment_link_url TEXT,
  stripe_payment_link_id TEXT,
  stripe_payment_intent_id TEXT,
  stripe_paid_at TIMESTAMPTZ,
  pdf_url TEXT,
  pdf_hash_sha256 TEXT,
  internal_notes TEXT,
  client_visible_notes TEXT,
  is_locked BOOLEAN DEFAULT false,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_invoices_project ON propulspace.invoices(project_id, issue_date DESC);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON propulspace.invoices(status, due_date) WHERE status IN ('sent', 'overdue');
CREATE INDEX IF NOT EXISTS idx_invoices_number ON propulspace.invoices(invoice_number);

DROP TRIGGER IF EXISTS audit_invoices ON propulspace.invoices;
CREATE TRIGGER audit_invoices
  AFTER INSERT OR UPDATE OR DELETE ON propulspace.invoices
  FOR EACH ROW EXECUTE FUNCTION propulspace.audit_trigger_fn();

CREATE TABLE IF NOT EXISTS propulspace.invoice_installments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id UUID NOT NULL REFERENCES propulspace.invoices(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  label TEXT,
  amount NUMERIC(10,2) NOT NULL,
  due_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  stripe_payment_link_url TEXT,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (invoice_id, installment_number)
);
CREATE INDEX IF NOT EXISTS idx_installments_invoice ON propulspace.invoice_installments(invoice_id, installment_number);
CREATE INDEX IF NOT EXISTS idx_installments_status ON propulspace.invoice_installments(status, due_date) WHERE status IN ('pending', 'overdue');

CREATE TABLE IF NOT EXISTS propulspace.signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects_v2(id),
  document_id UUID REFERENCES propulspace.documents(id) ON DELETE SET NULL,
  signature_type TEXT NOT NULL CHECK (signature_type IN ('quote', 'contract', 'addendum', 'other')),
  name TEXT NOT NULL,
  docuseal_submission_id TEXT UNIQUE NOT NULL,
  docuseal_template_id TEXT,
  docuseal_signing_url TEXT,
  docuseal_signed_pdf_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'signed', 'declined', 'expired', 'cancelled')),
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  signed_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  declined_at TIMESTAMPTZ,
  decline_reason TEXT,
  signer_ip INET,
  signer_user_agent TEXT,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_signatures_project ON propulspace.signatures(project_id, status, sent_at DESC);

DROP TRIGGER IF EXISTS audit_signatures ON propulspace.signatures;
CREATE TRIGGER audit_signatures
  AFTER INSERT OR UPDATE OR DELETE ON propulspace.signatures
  FOR EACH ROW EXECUTE FUNCTION propulspace.audit_trigger_fn();

CREATE TABLE IF NOT EXISTS propulspace.onboarding_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects_v2(id) ON DELETE CASCADE,
  inherited_from_qualification_id UUID REFERENCES propulspace.qualification_leads(id) ON DELETE SET NULL,
  detailed_personas JSONB,
  brand_voice_notes TEXT,
  content_strategy TEXT,
  logo_uploaded BOOLEAN DEFAULT false,
  charter_uploaded BOOLEAN DEFAULT false,
  content_uploaded BOOLEAN DEFAULT false,
  legal_mentions_provided BOOLEAN DEFAULT false,
  has_provided_google_access BOOLEAN DEFAULT false,
  has_provided_hosting_access BOOLEAN DEFAULT false,
  has_provided_dns_access BOOLEAN DEFAULT false,
  has_provided_social_access BOOLEAN DEFAULT false,
  access_credentials_vault_id TEXT,
  completion_percent INTEGER DEFAULT 0 CHECK (completion_percent BETWEEN 0 AND 100),
  is_complete BOOLEAN DEFAULT false,
  completed_at TIMESTAMPTZ,
  kickoff_call_scheduled_at TIMESTAMPTZ,
  kickoff_call_completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_onboarding_project ON propulspace.onboarding_responses(project_id);
