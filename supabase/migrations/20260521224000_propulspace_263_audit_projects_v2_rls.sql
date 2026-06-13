-- =============================================================================
-- R-018 — Étape 5/5 : documentation finale + vérification atomique
-- =============================================================================
-- Pose un COMMENT explicite sur la table projects_v2 décrivant le modèle de
-- sécurité RLS final. Sert de garde-fou pour les futures sessions :
-- toute modification doit respecter ces invariants.
--
-- La vérification finale check 4 invariants :
--   1. RLS activée sur la table
--   2. Exactement 3 policies (les 3 nouvelles scopées)
--   3. Trigger trg_guard_portal_columns_admin_only présent
--   4. Helpers is_team_member + guard_portal_columns_admin_only présents
--
-- Appliquée en prod : 2026-05-21 via MCP apply_migration.
-- =============================================================================

COMMENT ON TABLE public.projects_v2 IS
'Source de vérité des projets agence/client. RLS R-018 active depuis 2026-05-21 :
- Équipe interne (is_team_member()) : R/W complet via policy projects_v2_team_all
- Client portail (id = portal_project_id() match) : R sur sa ligne via projects_v2_portal_select + UPDATE sur 3 colonnes profil via projects_v2_portal_update
- INSERT/DELETE par le portail : bloqués silencieusement (aucune policy portail FOR INSERT/DELETE).
- service_role : bypass RLS (utilisé par les edge functions admin-*).
Tests : tests/sql/projects_v2_rls.sql (7 tests).';

-- Vérification finale exhaustive
DO $$
DECLARE
  v_rls_enabled boolean;
  v_policy_count int;
  v_trigger_count int;
  v_function_count int;
BEGIN
  SELECT relrowsecurity INTO v_rls_enabled FROM pg_class WHERE oid = 'public.projects_v2'::regclass;
  SELECT COUNT(*) INTO v_policy_count FROM pg_policy WHERE polrelid = 'public.projects_v2'::regclass;
  SELECT COUNT(*) INTO v_trigger_count FROM pg_trigger WHERE tgname = 'trg_guard_portal_columns_admin_only';
  SELECT COUNT(*) INTO v_function_count FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid
    WHERE n.nspname = 'public' AND p.proname IN ('is_team_member', 'guard_portal_columns_admin_only');

  IF NOT v_rls_enabled THEN RAISE EXCEPTION 'R-018 — RLS désactivée !'; END IF;
  IF v_policy_count <> 3 THEN RAISE EXCEPTION 'R-018 — Nombre de policies inattendu : % (attendu 3)', v_policy_count; END IF;
  IF v_trigger_count <> 1 THEN RAISE EXCEPTION 'R-018 — Trigger portail manquant'; END IF;
  IF v_function_count <> 2 THEN RAISE EXCEPTION 'R-018 — Helpers manquants (% trouvés, attendu 2)', v_function_count; END IF;

  RAISE NOTICE '✅ R-018 verrouillé : RLS active, 3 policies, 1 trigger, 2 helpers.';
END $$;
