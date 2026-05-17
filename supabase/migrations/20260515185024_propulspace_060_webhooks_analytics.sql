-- ⚠️ MIGRATION HISTORIQUE — DÉJÀ APPLIQUÉE EN PROD
-- Versionnée a posteriori le 2026-05-17 pour combler le drift repo/prod.
-- Source : supabase_migrations.schema_migrations (project ERP, tbuqctfgjjxnevmsvucl).
-- Ne PAS rejouer sur la prod existante.
-- Pour env neuf uniquement (clone + supabase db reset).

-- ============================================================================
-- Migration 060 — Webhooks (Stripe + DocuSeal) + analytics events
-- Idempotency via UNIQUE constraint on external event IDs
-- ============================================================================

CREATE TABLE IF NOT EXISTS propulspace.stripe_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  processing_error TEXT,
  received_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_stripe_events_unprocessed ON propulspace.stripe_webhook_events(received_at) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_stripe_events_type ON propulspace.stripe_webhook_events(event_type, received_at DESC);

COMMENT ON TABLE propulspace.stripe_webhook_events IS
  'Stripe webhook idempotency. INSERT ... ON CONFLICT (stripe_event_id) DO NOTHING RETURNING id to detect duplicates.';

CREATE TABLE IF NOT EXISTS propulspace.docuseal_webhook_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  docuseal_event_id TEXT UNIQUE NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  processed_at TIMESTAMPTZ,
  processing_error TEXT,
  received_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_docuseal_events_unprocessed ON propulspace.docuseal_webhook_events(received_at) WHERE processed = false;
CREATE INDEX IF NOT EXISTS idx_docuseal_events_type ON propulspace.docuseal_webhook_events(event_type, received_at DESC);

COMMENT ON TABLE propulspace.docuseal_webhook_events IS
  'DocuSeal webhook idempotency. Same pattern as Stripe events.';

CREATE TABLE IF NOT EXISTS propulspace.analytics_events (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id UUID REFERENCES public.projects_v2(id) ON DELETE SET NULL,
  qualification_lead_id UUID REFERENCES propulspace.qualification_leads(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  properties JSONB DEFAULT '{}'::jsonb,
  session_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_analytics_event_name ON propulspace.analytics_events(event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_project ON propulspace.analytics_events(project_id, created_at DESC) WHERE project_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_lead ON propulspace.analytics_events(qualification_lead_id, created_at DESC) WHERE qualification_lead_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_analytics_session ON propulspace.analytics_events(session_id, created_at DESC) WHERE session_id IS NOT NULL;

COMMENT ON TABLE propulspace.analytics_events IS
  'Funnel analytics events: qualification_submitted, login, invoice_paid, document_downloaded, signature_completed, etc.';
