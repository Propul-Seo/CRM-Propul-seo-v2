-- =============================================================================
-- R-018 — Étape 4/5 : BASCULE — DROP ancienne policy permissive
-- =============================================================================
-- Moment critique : on supprime la policy authenticated_all_projects_v2
-- (FOR ALL USING true) qui laissait passer tous les authenticated.
-- Désormais seules les 3 policies scopées (migration 261) sont actives :
--   - projects_v2_team_all       FOR ALL    USING is_team_member()
--   - projects_v2_portal_select  FOR SELECT USING id = portal_project_id()
--   - projects_v2_portal_update  FOR UPDATE USING + WITH CHECK id = portal_project_id()
--
-- Rollback d'urgence (à coller via MCP execute_sql si bascule KO) :
--   CREATE POLICY authenticated_all_projects_v2 ON public.projects_v2
--     FOR ALL TO authenticated USING (true) WITH CHECK (true);
--
-- Validation : tests/sql/projects_v2_rls.sql → 7/7 PASS post-bascule.
-- Appliquée en prod : 2026-05-21 via MCP apply_migration.
-- =============================================================================

DROP POLICY IF EXISTS authenticated_all_projects_v2 ON public.projects_v2;

-- Vérification atomique : exactement 3 policies attendues sur projects_v2
DO $$
DECLARE v_count int;
BEGIN
  SELECT COUNT(*) INTO v_count FROM pg_policy
  WHERE polrelid = 'public.projects_v2'::regclass;
  IF v_count <> 3 THEN
    RAISE EXCEPTION 'R-018 BASCULE — État de policies inattendu : % policies trouvées (attendu 3)', v_count;
  END IF;
END $$;
