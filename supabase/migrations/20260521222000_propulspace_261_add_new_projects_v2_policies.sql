-- =============================================================================
-- R-018 — Étape 3/5 : ajout des 3 nouvelles policies projects_v2 (additif)
-- =============================================================================
-- Mode additif : l'ancienne policy authenticated_all_projects_v2 (FOR ALL
-- USING true) reste active. Postgres applique le OR entre policies permissives
-- → tant que l'ancienne est là, rien ne change côté app.
--
-- La bascule effective (DROP de l'ancienne) se fait en migration 262.
--
-- Pourquoi 2 étapes : si la nouvelle config a un bug, on DROP juste les
-- nouvelles policies sans toucher à l'ancienne et l'app continue de marcher.
--
-- Architecture finale (après migration 262) :
--   1. projects_v2_team_all (FOR ALL) :
--      Équipe interne (is_team_member) → accès R/W complet.
--   2. projects_v2_portal_select (FOR SELECT) :
--      Client portail → voit UNIQUEMENT son projet (matché via
--      propulspace.portal_project_id() = lookup portal_client_email JWT).
--   3. projects_v2_portal_update (FOR UPDATE) :
--      Client portail → update UNIQUEMENT sa ligne. Colonnes restreintes
--      par le trigger guard_portal_columns_admin_only (migration 260).
--
-- Appliquée en prod : 2026-05-21 via MCP apply_migration.
-- =============================================================================

CREATE POLICY projects_v2_team_all
  ON public.projects_v2
  FOR ALL
  TO authenticated
  USING (public.is_team_member())
  WITH CHECK (public.is_team_member());

CREATE POLICY projects_v2_portal_select
  ON public.projects_v2
  FOR SELECT
  TO authenticated
  USING (id = propulspace.portal_project_id());

CREATE POLICY projects_v2_portal_update
  ON public.projects_v2
  FOR UPDATE
  TO authenticated
  USING (id = propulspace.portal_project_id())
  WITH CHECK (id = propulspace.portal_project_id());

COMMENT ON POLICY projects_v2_team_all ON public.projects_v2 IS
'R-018 — Équipe interne (is_team_member() = présence dans public.users avec role non-NULL) a accès R/W complet.';

COMMENT ON POLICY projects_v2_portal_select ON public.projects_v2 IS
'R-018 — Client portail voit UNIQUEMENT son projet (matché via portal_client_email JWT par propulspace.portal_project_id()).';

COMMENT ON POLICY projects_v2_portal_update ON public.projects_v2 IS
'R-018 — Client portail peut updater UNIQUEMENT sa ligne. Colonnes restreintes par trigger guard_portal_columns_admin_only.';
