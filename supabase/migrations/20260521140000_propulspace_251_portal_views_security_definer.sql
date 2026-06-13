-- ============================================================================
-- Migration 251 — Fix 403 sur portal_health + portal_state (vues SECURITY DEFINER)
-- ============================================================================
-- Bug observé : les vues introduites en 249 et 250 renvoyaient 403 côté front
-- pour les rôles authenticated (y compris admins). Cause : security_invoker=true
-- + JOIN sur auth.users → le caller (authenticated) n'a pas SELECT sur auth.users
-- (table système Supabase, accès réservé service_role/postgres).
--
-- Fix : passer les 2 vues en SECURITY DEFINER (default), c'est-à-dire enlever
-- security_invoker=true. La jointure auth.users marche désormais (postgres
-- a tous les droits). Le filtre `WHERE propulspace.is_propulseo_team()`
-- compense l'absence de RLS héritée en restreignant aux membres de l'équipe.
-- ============================================================================

DROP VIEW IF EXISTS public.projects_portal_health_v2;
DROP VIEW IF EXISTS public.propulspace_portal_state_v2;

CREATE VIEW public.projects_portal_health_v2 AS
SELECT
  p.id                                AS project_id,
  p.name                              AS project_name,
  p.portal_client_email,
  p.portal_activated_at,
  au.last_sign_in_at                  AS last_client_login_at,
  COALESCE((SELECT COUNT(*)::INT FROM propulspace.invoices i WHERE i.project_id = p.id AND i.status = 'sent' AND i.due_date IS NOT NULL AND i.due_date < CURRENT_DATE), 0) AS invoices_overdue,
  COALESCE((SELECT COUNT(*)::INT FROM propulspace.invoices i WHERE i.project_id = p.id AND i.status = 'sent'), 0) AS invoices_pending,
  COALESCE((SELECT COUNT(*)::INT FROM propulspace.signatures s WHERE s.project_id = p.id AND s.status = 'pending' AND s.signed_at IS NULL), 0) AS signatures_pending,
  COALESCE((SELECT COUNT(*)::INT FROM propulspace.documents d WHERE d.project_id = p.id), 0) AS documents_count
FROM public.projects_v2 p
LEFT JOIN auth.users au ON au.email = p.portal_client_email
WHERE p.portal_client_email IS NOT NULL
  AND propulspace.is_propulseo_team();

COMMENT ON VIEW public.projects_portal_health_v2 IS
  'Agrégation santé portail par projet (équipe agence only). Vue SECURITY DEFINER pour pouvoir joindre auth.users — filtre WHERE is_propulseo_team() compense.';

GRANT SELECT ON public.projects_portal_health_v2 TO authenticated;

CREATE VIEW public.propulspace_portal_state_v2 AS
SELECT
  p.id                      AS project_id,
  p.name                    AS project_name,
  p.portal_client_email,
  p.portal_activated_at,
  au.email IS NOT NULL      AS has_auth_account,
  au.last_sign_in_at        AS last_login_at,
  CASE
    WHEN p.portal_client_email IS NULL                               THEN 'inactive'
    WHEN au.email IS NULL AND p.portal_activated_at IS NULL          THEN 'orphan'
    WHEN au.email IS NULL AND p.portal_activated_at IS NOT NULL      THEN 'broken'
    WHEN au.last_sign_in_at IS NULL                                  THEN 'invited'
    ELSE 'active'
  END                       AS state
FROM public.projects_v2 p
LEFT JOIN auth.users au ON au.email = p.portal_client_email
WHERE propulspace.is_propulseo_team();

COMMENT ON VIEW public.propulspace_portal_state_v2 IS
  'État réel du portail par projet (équipe agence only). Vue SECURITY DEFINER pour joindre auth.users — filtre WHERE compense.';

GRANT SELECT ON public.propulspace_portal_state_v2 TO authenticated;
