-- ============================================================================
-- Migration 250 — Clean portails fantômes + vue d'état réel portail
-- ============================================================================
-- Contexte : 5 projets avaient un portal_client_email rempli mais aucun
-- compte auth.users correspondant (anciens UPDATE manuels ou compte supprimé
-- via service_role). L'UI les affichait à tort comme "Actif".
--
-- 1. Désactive temporairement le trigger guard_portal_columns_admin_only
--    pour permettre le UPDATE de nettoyage (le trigger refuse les writes
--    quand auth.uid() est NULL, ce qui est le cas en migration directe).
-- 2. UPDATE de nettoyage : ne touche QUE les projets dont l'email portail
--    n'a aucun compte auth associé (filtre LEFT JOIN auth.users WHERE NULL).
-- 3. Réactive le trigger.
-- 4. Crée la vue public.propulspace_portal_state_v2 qui calcule l'état réel
--    en joignant auth.users (security_invoker + filtre équipe).
-- ============================================================================

-- ───────────────────────────────────────────────────────────────────────────
-- 1. Clean des portails fantômes
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE public.projects_v2 DISABLE TRIGGER guard_portal_columns_admin_only;

UPDATE public.projects_v2 p
SET portal_client_email = NULL,
    portal_activated_at = NULL,
    portal_previous_client_email = NULL,
    updated_at = NOW()
WHERE p.portal_client_email IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM auth.users au WHERE au.email = p.portal_client_email
  );

ALTER TABLE public.projects_v2 ENABLE TRIGGER guard_portal_columns_admin_only;

-- ───────────────────────────────────────────────────────────────────────────
-- 2. Vue d'état réel portail (par projet)
-- ───────────────────────────────────────────────────────────────────────────
-- Retourne l'état exact pour chaque projet :
--   - inactive : pas d'email portail
--   - orphan   : email + activated_at NULL + pas de compte auth
--   - broken   : email + activated_at remplis + pas de compte auth (suppression user)
--   - invited  : email + compte auth + jamais connecté (last_sign_in_at NULL)
--   - active   : email + compte auth + connecté au moins une fois

DROP VIEW IF EXISTS public.propulspace_portal_state_v2;

CREATE VIEW public.propulspace_portal_state_v2 WITH (security_invoker = true) AS
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
  'État réel du portail par projet (équipe agence only). 5 états : inactive | orphan | broken | invited | active. Source : projects_v2 + auth.users.';

GRANT SELECT ON public.propulspace_portal_state_v2 TO authenticated;
