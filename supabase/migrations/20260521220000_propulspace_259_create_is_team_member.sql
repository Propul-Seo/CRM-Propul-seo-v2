-- =============================================================================
-- R-018 — Étape 1/5 : helper is_team_member()
-- =============================================================================
-- Crée un helper SECURITY DEFINER utilisé par les nouvelles policies RLS
-- de projects_v2 (et tables liées). Retourne TRUE si l'utilisateur connecté
-- est un membre de l'équipe interne Propul'SEO, c'est-à-dire présent dans
-- public.users avec un role non-NULL.
--
-- Pourquoi cette approche plutôt que is_admin() ? Parce que is_admin() ne
-- couvre QUE le rôle 'admin' et l'email team@propulseo-site.com. Les
-- commerciaux/marketing/dev seraient bloqués par la nouvelle policy
-- projects_v2_team_all. La présence dans public.users avec role non-NULL
-- est fail-safe : tout nouveau rôle interne fonctionne sans nouvelle migration.
--
-- Appliquée en prod : 2026-05-21 via MCP apply_migration.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.is_team_member()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  user_role text;
BEGIN
  SELECT role INTO user_role
  FROM public.users
  WHERE auth_user_id = auth.uid();

  RETURN user_role IS NOT NULL;
END;
$$;

COMMENT ON FUNCTION public.is_team_member() IS
'R-018 — Renvoie true si l''utilisateur connecté est un membre interne (présent dans public.users avec un role non-NULL). Utilisé par les policies RLS de projects_v2 et tables liées.';

GRANT EXECUTE ON FUNCTION public.is_team_member() TO authenticated;
