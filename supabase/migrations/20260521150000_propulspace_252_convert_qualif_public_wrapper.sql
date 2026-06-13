-- ============================================================================
-- Migration 252 — Wrapper public manquant pour admin_convert_qualif_to_project
-- ============================================================================
-- Bug observé : front appelait supabase.rpc('admin_convert_qualif_to_project',
-- {p_qualif_id, p_activate_portal}) qui renvoyait 404 "Could not find the
-- function public.admin_convert_qualif_to_project in the schema cache".
--
-- Cause : la migration 245 (BLOC 2) a créé la fonction dans le schéma
-- propulspace mais OUBLIÉ le wrapper public.* équivalent. PostgREST n'expose
-- que public par défaut.
--
-- Fix : ajouter le wrapper public qui délègue à propulspace.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.admin_convert_qualif_to_project(
  p_qualif_id UUID,
  p_activate_portal BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE sql
VOLATILE
SET search_path = public, pg_temp
AS $$
  SELECT propulspace.admin_convert_qualif_to_project(p_qualif_id, p_activate_portal);
$$;

REVOKE EXECUTE ON FUNCTION public.admin_convert_qualif_to_project(UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_convert_qualif_to_project(UUID, BOOLEAN) TO authenticated;

COMMENT ON FUNCTION public.admin_convert_qualif_to_project(UUID, BOOLEAN) IS
  'Wrapper PostgREST. Délègue à propulspace.admin_convert_qualif_to_project (SECURITY DEFINER, admin only).';
