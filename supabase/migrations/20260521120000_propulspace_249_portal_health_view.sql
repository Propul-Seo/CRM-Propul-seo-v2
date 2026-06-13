-- ============================================================================
-- Migration 249 — Vue d'agrégation "santé portail" des projets
-- ============================================================================
-- But : alimenter les badges sur les cartes ProjectCardV3 (kanban admin) avec
-- la santé du portail client de chaque projet.
--
-- La vue renvoie 1 ligne par projet qui a son portail activé
-- (portal_client_email IS NOT NULL).
--
-- Champs agrégés :
--   • last_client_login_at : depuis auth.users.last_sign_in_at via email match
--   • invoices_overdue    : factures status='sent' AND due_date < CURRENT_DATE
--   • invoices_pending    : factures status='sent' (toutes à payer)
--   • signatures_pending  : signatures status='pending' AND signed_at IS NULL
--   • documents_count     : docs ajoutés dans la GED projet
--
-- Sécurité :
--   • security_invoker=true → respecte les RLS de chaque table sous-jacente
--   • WHERE propulspace.is_propulseo_team() → réservé équipe agence
--   • GRANT SELECT à authenticated (la clause WHERE filtre les non-équipe)
--
-- Rollback : DROP VIEW IF EXISTS public.projects_portal_health_v2;
-- ============================================================================

DROP VIEW IF EXISTS public.projects_portal_health_v2;

CREATE VIEW public.projects_portal_health_v2 WITH (security_invoker = true) AS
SELECT
  p.id                                AS project_id,
  p.name                              AS project_name,
  p.portal_client_email,
  p.portal_activated_at,
  au.last_sign_in_at                  AS last_client_login_at,
  COALESCE((
    SELECT COUNT(*)::INT FROM propulspace.invoices i
     WHERE i.project_id = p.id
       AND i.status = 'sent'
       AND i.due_date IS NOT NULL
       AND i.due_date < CURRENT_DATE
  ), 0)                               AS invoices_overdue,
  COALESCE((
    SELECT COUNT(*)::INT FROM propulspace.invoices i
     WHERE i.project_id = p.id
       AND i.status = 'sent'
  ), 0)                               AS invoices_pending,
  COALESCE((
    SELECT COUNT(*)::INT FROM propulspace.signatures s
     WHERE s.project_id = p.id
       AND s.status = 'pending'
       AND s.signed_at IS NULL
  ), 0)                               AS signatures_pending,
  COALESCE((
    SELECT COUNT(*)::INT FROM propulspace.documents d
     WHERE d.project_id = p.id
  ), 0)                               AS documents_count
FROM public.projects_v2 p
LEFT JOIN auth.users au ON au.email = p.portal_client_email
WHERE p.portal_client_email IS NOT NULL
  AND propulspace.is_propulseo_team();

COMMENT ON VIEW public.projects_portal_health_v2 IS
  'Agrégation santé portail par projet (équipe agence only). Alimente les badges ProjectCardV3.';

GRANT SELECT ON public.projects_portal_health_v2 TO authenticated;
