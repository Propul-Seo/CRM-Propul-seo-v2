-- Sprint 4 : Policies RLS anon pour les pages publiques (portal & brief)
-- ======================================================================

-- === v2.projects — lecture anon par portal_token ou brief_token ===

CREATE POLICY anon_portal_read ON v2.projects
  FOR SELECT
  TO anon
  USING (
    portal_enabled = true
    AND portal_token IS NOT NULL
  );

CREATE POLICY anon_brief_read ON v2.projects
  FOR SELECT
  TO anon
  USING (
    brief_token IS NOT NULL
  );

-- === v2.checklist_items — lecture anon si le projet est accessible via portal ===

CREATE POLICY anon_checklist_read ON v2.checklist_items
  FOR SELECT
  TO anon
  USING (
    project_id IN (
      SELECT id FROM v2.projects
      WHERE portal_enabled = true AND portal_token IS NOT NULL
    )
  );

-- === v2.invoices — lecture anon (envoyées/payées/overdue) si portal actif ===

CREATE POLICY anon_invoices_read ON v2.invoices
  FOR SELECT
  TO anon
  USING (
    status IN ('sent', 'paid', 'overdue')
    AND project_id IN (
      SELECT id FROM v2.projects
      WHERE portal_enabled = true AND portal_token IS NOT NULL
    )
  );

-- === v2.project_briefs — lecture/écriture anon par brief_token ===

CREATE POLICY anon_brief_data_read ON v2.project_briefs
  FOR SELECT
  TO anon
  USING (
    project_id IN (
      SELECT id FROM v2.projects
      WHERE brief_token IS NOT NULL
    )
  );

CREATE POLICY anon_brief_data_update ON v2.project_briefs
  FOR UPDATE
  TO anon
  USING (
    project_id IN (
      SELECT id FROM v2.projects
      WHERE brief_token IS NOT NULL
    )
  )
  WITH CHECK (true);
