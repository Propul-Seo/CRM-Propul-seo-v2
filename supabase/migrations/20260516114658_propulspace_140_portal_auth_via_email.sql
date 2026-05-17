-- ⚠️ MIGRATION HISTORIQUE — DÉJÀ APPLIQUÉE EN PROD
-- Versionnée a posteriori le 2026-05-17 pour combler le drift repo/prod.
-- Source : supabase_migrations.schema_migrations (project ERP, tbuqctfgjjxnevmsvucl).
-- Ne PAS rejouer sur la prod existante.
-- Pour env neuf uniquement (clone + supabase db reset).
--
-- ⚠️ ADR-001 : remplace propulspace.portal_project_id() v1 (créée en 070,
-- lisait public.users.portal_linked_project_id) par v2 qui lit
-- projects_v2.portal_client_email. Le client n'a plus besoin d'une row
-- dans public.users — table réservée aux internes Propul'SEO.
--
-- ⚠️ Risque R-009 (déjà documenté) :
--   - Pas d'INDEX sur portal_client_email → full scan à chaque appel
--   - Pas d'UNIQUE → 2 projets même email = LIMIT 1 arbitraire

CREATE OR REPLACE FUNCTION propulspace.portal_project_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $function$
  SELECT id
  FROM public.projects_v2
  WHERE portal_client_email = (SELECT email FROM auth.users WHERE id = auth.uid())
    AND portal_client_email IS NOT NULL
  LIMIT 1;
$function$;
