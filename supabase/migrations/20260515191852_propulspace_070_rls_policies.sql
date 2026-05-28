-- ⚠️ MIGRATION HISTORIQUE — DÉJÀ APPLIQUÉE EN PROD
-- Versionnée a posteriori le 2026-05-17 pour combler le drift repo/prod.
-- Source : supabase_migrations.schema_migrations (project ERP, tbuqctfgjjxnevmsvucl).
-- Ne PAS rejouer sur la prod existante.
-- Pour env neuf uniquement (clone + supabase db reset).
--
-- ⚠️ NOTE V1/V2 : la fonction propulspace.portal_project_id() ci-dessous
-- est la VERSION 1 (lit public.users.portal_linked_project_id). Elle sera
-- REMPLACÉE par la migration 140 (ADR-001) qui la fait lire
-- projects_v2.portal_client_email. CREATE OR REPLACE permet ce remplacement
-- sur env neuf via le rejeu chronologique 010 → 150.

-- ============================================================================
-- Migration 070 — RLS policies for all 12 propulspace tables
-- Pattern: helper functions is_admin() + portal_project_id() simplify policies
-- ============================================================================

CREATE OR REPLACE FUNCTION propulspace.is_admin()
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.users
    WHERE auth_user_id = auth.uid()
    AND role IN ('admin', 'manager')
  );
$$;
GRANT EXECUTE ON FUNCTION propulspace.is_admin() TO authenticated;

CREATE OR REPLACE FUNCTION propulspace.portal_project_id()
RETURNS UUID
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
  SELECT portal_linked_project_id
  FROM public.users
  WHERE auth_user_id = auth.uid()
  AND portal_enabled = true
  LIMIT 1;
$$;
GRANT EXECUTE ON FUNCTION propulspace.portal_project_id() TO authenticated;

-- Enable RLS on all tables
ALTER TABLE propulspace.qualification_leads      ENABLE ROW LEVEL SECURITY;
ALTER TABLE propulspace.qualification_uploads    ENABLE ROW LEVEL SECURITY;
ALTER TABLE propulspace.project_steps            ENABLE ROW LEVEL SECURITY;
ALTER TABLE propulspace.documents                ENABLE ROW LEVEL SECURITY;
ALTER TABLE propulspace.invoices                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE propulspace.invoice_installments     ENABLE ROW LEVEL SECURITY;
ALTER TABLE propulspace.signatures               ENABLE ROW LEVEL SECURITY;
ALTER TABLE propulspace.onboarding_responses     ENABLE ROW LEVEL SECURITY;
ALTER TABLE propulspace.audit_log                ENABLE ROW LEVEL SECURITY;
ALTER TABLE propulspace.analytics_events         ENABLE ROW LEVEL SECURITY;
ALTER TABLE propulspace.stripe_webhook_events    ENABLE ROW LEVEL SECURITY;
ALTER TABLE propulspace.docuseal_webhook_events  ENABLE ROW LEVEL SECURITY;

-- qualification_leads
CREATE POLICY "ps_qualif_admin_all" ON propulspace.qualification_leads
  FOR ALL TO authenticated USING (propulspace.is_admin()) WITH CHECK (propulspace.is_admin());

-- qualification_uploads
CREATE POLICY "ps_qualif_uploads_admin_all" ON propulspace.qualification_uploads
  FOR ALL TO authenticated USING (propulspace.is_admin()) WITH CHECK (propulspace.is_admin());

-- project_steps
CREATE POLICY "ps_steps_admin_all" ON propulspace.project_steps
  FOR ALL TO authenticated USING (propulspace.is_admin()) WITH CHECK (propulspace.is_admin());
CREATE POLICY "ps_steps_client_read" ON propulspace.project_steps
  FOR SELECT TO authenticated
  USING (project_id = propulspace.portal_project_id() AND visible_to_client = true);

-- documents
CREATE POLICY "ps_docs_admin_all" ON propulspace.documents
  FOR ALL TO authenticated USING (propulspace.is_admin()) WITH CHECK (propulspace.is_admin());
CREATE POLICY "ps_docs_client_read" ON propulspace.documents
  FOR SELECT TO authenticated
  USING (
    project_id = propulspace.portal_project_id()
    AND visible_to_client = true
    AND deleted_at IS NULL
  );
CREATE POLICY "ps_docs_client_insert" ON propulspace.documents
  FOR INSERT TO authenticated
  WITH CHECK (
    project_id = propulspace.portal_project_id()
    AND uploaded_by_client = true
    AND deleted_at IS NULL
  );

-- invoices
CREATE POLICY "ps_invoices_admin_all" ON propulspace.invoices
  FOR ALL TO authenticated USING (propulspace.is_admin()) WITH CHECK (propulspace.is_admin());
CREATE POLICY "ps_invoices_client_read" ON propulspace.invoices
  FOR SELECT TO authenticated
  USING (project_id = propulspace.portal_project_id() AND status != 'draft');

-- invoice_installments
CREATE POLICY "ps_installments_admin_all" ON propulspace.invoice_installments
  FOR ALL TO authenticated USING (propulspace.is_admin()) WITH CHECK (propulspace.is_admin());
CREATE POLICY "ps_installments_client_read" ON propulspace.invoice_installments
  FOR SELECT TO authenticated
  USING (
    invoice_id IN (
      SELECT id FROM propulspace.invoices
      WHERE project_id = propulspace.portal_project_id()
      AND status != 'draft'
    )
  );

-- signatures
CREATE POLICY "ps_signatures_admin_all" ON propulspace.signatures
  FOR ALL TO authenticated USING (propulspace.is_admin()) WITH CHECK (propulspace.is_admin());
CREATE POLICY "ps_signatures_client_read" ON propulspace.signatures
  FOR SELECT TO authenticated
  USING (project_id = propulspace.portal_project_id());

-- onboarding_responses
CREATE POLICY "ps_onboarding_admin_all" ON propulspace.onboarding_responses
  FOR ALL TO authenticated USING (propulspace.is_admin()) WITH CHECK (propulspace.is_admin());
CREATE POLICY "ps_onboarding_client_read" ON propulspace.onboarding_responses
  FOR SELECT TO authenticated
  USING (project_id = propulspace.portal_project_id());
CREATE POLICY "ps_onboarding_client_update" ON propulspace.onboarding_responses
  FOR UPDATE TO authenticated
  USING (project_id = propulspace.portal_project_id())
  WITH CHECK (project_id = propulspace.portal_project_id());

-- audit_log (admin SELECT only, writes via SECURITY DEFINER trigger)
CREATE POLICY "ps_audit_admin_read" ON propulspace.audit_log
  FOR SELECT TO authenticated USING (propulspace.is_admin());

-- analytics_events (admin SELECT only, writes via service_role)
CREATE POLICY "ps_analytics_admin_read" ON propulspace.analytics_events
  FOR SELECT TO authenticated USING (propulspace.is_admin());

-- webhook_events: no policies = RLS blocks all for authenticated/anon (service_role bypasses RLS)
