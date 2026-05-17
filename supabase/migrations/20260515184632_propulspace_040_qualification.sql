-- ⚠️ MIGRATION HISTORIQUE — DÉJÀ APPLIQUÉE EN PROD
-- Versionnée a posteriori le 2026-05-17 pour combler le drift repo/prod.
-- Source : supabase_migrations.schema_migrations (project ERP, tbuqctfgjjxnevmsvucl).
-- Ne PAS rejouer sur la prod existante.
-- Pour env neuf uniquement (clone + supabase db reset).

-- ============================================================================
-- Migration 040 — Qualification tables (Phase 0)
-- ============================================================================

CREATE TABLE IF NOT EXISTS propulspace.qualification_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Identity (Step 1, required)
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  company_name TEXT,
  business_sector TEXT NOT NULL,
  business_sector_custom TEXT,
  -- Current situation (Step 2, conditional)
  has_existing_site BOOLEAN,
  existing_site_url TEXT,
  monthly_traffic TEXT,
  main_problems TEXT[],
  has_domain_only BOOLEAN,
  -- Goals (Step 3)
  main_goal TEXT,
  target_audience TEXT,
  competitors TEXT,
  -- Features (Step 4, conditional)
  desired_features TEXT[],
  ecommerce_platform TEXT,
  product_count_range TEXT,
  monthly_orders_range TEXT,
  reservation_type TEXT,
  health_specific_needs TEXT,
  -- Visual identity (Step 5)
  has_visual_identity TEXT,
  wants_identity_creation BOOLEAN,
  -- Budget & timing (Step 6)
  budget_range TEXT NOT NULL,
  desired_timeline TEXT,
  timeline_reason TEXT,
  -- Decision & contact (Step 7)
  is_decision_maker TEXT,
  preferred_contact_method TEXT,
  final_cta_choice TEXT,
  -- Quality scoring V1 (budget + decision-maker only, max 70)
  quality_score INTEGER DEFAULT 0 CHECK (quality_score BETWEEN 0 AND 100),
  quality_score_breakdown JSONB,
  -- Admin pipeline status
  status TEXT NOT NULL DEFAULT 'submitted' CHECK (status IN (
    'draft', 'submitted', 'contacted', 'qualified', 'unqualified', 'converted'
  )),
  draft_progress_percent INTEGER DEFAULT 0 CHECK (draft_progress_percent BETWEEN 0 AND 100),
  -- Conversion (1 espace = 1 projet architecture)
  converted_to_project_id UUID REFERENCES public.projects_v2(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ae_assigned UUID REFERENCES public.users(id) ON DELETE SET NULL,
  -- Tracking
  source TEXT DEFAULT 'website',
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  ip_address INET,
  user_agent TEXT,
  pappers_enrichment JSONB,
  -- Timestamps
  submitted_at TIMESTAMPTZ,
  contacted_at TIMESTAMPTZ,
  converted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE propulspace.qualification_leads IS
  'Leads from public Phase 0 qualification form. 30+ fields incl. conditional flows. Converted to public.projects_v2 upon win.';

CREATE INDEX IF NOT EXISTS idx_qualif_status
  ON propulspace.qualification_leads(status, submitted_at DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_qualif_email
  ON propulspace.qualification_leads(email);
CREATE INDEX IF NOT EXISTS idx_qualif_phone
  ON propulspace.qualification_leads(phone);
CREATE INDEX IF NOT EXISTS idx_qualif_ae
  ON propulspace.qualification_leads(ae_assigned) WHERE ae_assigned IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_qualif_converted_project
  ON propulspace.qualification_leads(converted_to_project_id) WHERE converted_to_project_id IS NOT NULL;

CREATE TRIGGER audit_qualification_leads
  AFTER INSERT OR UPDATE OR DELETE ON propulspace.qualification_leads
  FOR EACH ROW EXECUTE FUNCTION propulspace.audit_trigger_fn();

-- ============================================================================
-- qualification_uploads (file attachments)
-- ============================================================================
CREATE TABLE IF NOT EXISTS propulspace.qualification_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qualification_lead_id UUID NOT NULL REFERENCES propulspace.qualification_leads(id) ON DELETE CASCADE,
  upload_type TEXT NOT NULL CHECK (upload_type IN ('logo', 'charter', 'site_screenshot', 'other')),
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  file_mime_type TEXT,
  original_filename TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE propulspace.qualification_uploads IS
  'File uploads attached to a qualification lead (logo, charter, site screenshots).';

CREATE INDEX IF NOT EXISTS idx_qualif_uploads_lead
  ON propulspace.qualification_uploads(qualification_lead_id, uploaded_at DESC);
