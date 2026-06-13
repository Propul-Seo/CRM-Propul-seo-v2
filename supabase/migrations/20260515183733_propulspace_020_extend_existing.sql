-- ⚠️ MIGRATION HISTORIQUE — DÉJÀ APPLIQUÉE EN PROD
-- Versionnée a posteriori le 2026-05-17 pour combler le drift repo/prod.
-- Source : supabase_migrations.schema_migrations (project ERP, tbuqctfgjjxnevmsvucl).
-- Ne PAS rejouer sur la prod existante.
-- Pour env neuf uniquement (clone + supabase db reset).

-- ============================================================================
-- Migration 020 — Extend public.users and public.projects_v2
-- All ADD COLUMN IF NOT EXISTS + DEFAULT/NULL -> zero impact on running app
-- ============================================================================

-- Bloc 1 : Extend public.users (3 new columns)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS portal_enabled BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS portal_linked_project_id UUID REFERENCES public.projects_v2(id),
  ADD COLUMN IF NOT EXISTS portal_last_login_at TIMESTAMPTZ;

COMMENT ON COLUMN public.users.portal_enabled IS
  'True if this user is a Propul''Space portal client (not an internal team member).';
COMMENT ON COLUMN public.users.portal_linked_project_id IS
  'For portal users only: the project they have access to in their Propul''Space.';

-- Bloc 2 : Extend public.projects_v2 — Visibility & lifecycle (10 cols)
ALTER TABLE public.projects_v2
  ADD COLUMN IF NOT EXISTS portal_visible BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS portal_phase TEXT CHECK (portal_phase IN (
    'qualification', 'discovery', 'proposal_sent', 'proposal_signed',
    'contract_signed', 'deposit_paid', 'onboarding', 'active_project',
    'completed', 'churned'
  )),
  ADD COLUMN IF NOT EXISTS portal_url_slug TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS portal_activated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS portal_deactivated_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS portal_deactivation_reason TEXT,
  ADD COLUMN IF NOT EXISTS portal_next_milestone_label TEXT,
  ADD COLUMN IF NOT EXISTS portal_next_milestone_date DATE,
  ADD COLUMN IF NOT EXISTS portal_published_hours_worked NUMERIC(10,2) DEFAULT 0,
  ADD COLUMN IF NOT EXISTS portal_progress_percent INTEGER DEFAULT 0
    CHECK (portal_progress_percent BETWEEN 0 AND 100);

-- Bloc 3 : Branding portail (2 cols)
ALTER TABLE public.projects_v2
  ADD COLUMN IF NOT EXISTS portal_brand_logo_url TEXT,
  ADD COLUMN IF NOT EXISTS portal_brand_primary_color TEXT;

-- Bloc 4 : Infos client pour facturation FR (3 cols)
ALTER TABLE public.projects_v2
  ADD COLUMN IF NOT EXISTS client_address TEXT,
  ADD COLUMN IF NOT EXISTS client_vat_number TEXT,
  ADD COLUMN IF NOT EXISTS client_represented_by TEXT;

COMMENT ON COLUMN public.projects_v2.portal_visible IS
  'Propul''Space: project visible in client portal (different from legacy portal_enabled used by ClientBrief).';
COMMENT ON COLUMN public.projects_v2.portal_phase IS
  'Current Propul''Space lifecycle phase for this project.';
COMMENT ON COLUMN public.projects_v2.client_address IS
  'Full client address for FR-compliant invoice generation.';
COMMENT ON COLUMN public.projects_v2.client_vat_number IS
  'Client EU intracommunity VAT number (for EU clients).';
COMMENT ON COLUMN public.projects_v2.client_represented_by IS
  'Person legally representing the client company on invoices and contracts.';
