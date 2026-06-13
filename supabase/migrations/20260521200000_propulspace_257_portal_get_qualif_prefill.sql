-- ============================================================================
-- Migration 257 — RPC portal_get_qualif_prefill pour WelcomeWizard
-- ============================================================================
-- Bug latent : useWelcomeWizard.ts faisait un SELECT direct sur
-- propulspace.qualification_leads côté portail. La table n'a que la policy
-- ps_qualif_admin_all (admin/manager only) → le client portail recevait 0 ligne
-- silencieusement, donc le pré-remplissage des coordonnées du wizard
-- (welcome_first_name, welcome_phone, welcome_company) ne marchait pas.
--
-- Fix : RPC SECURITY DEFINER qui résout le projet courant via
-- propulspace.portal_project_id() (basé sur l'email auth), trouve la qualif
-- liée via onboarding_responses.inherited_from_qualification_id, et retourne
-- une whitelist de colonnes utiles. Un client ne peut JAMAIS voir la qualif
-- d'un autre projet : sécurité naturelle via portal_project_id().
-- ============================================================================

CREATE OR REPLACE FUNCTION propulspace.portal_get_qualif_prefill()
RETURNS TABLE(
  id uuid,
  full_name text,
  email text,
  phone text,
  company_name text,
  business_sector text,
  main_goal text,
  budget_range text,
  desired_timeline text,
  desired_features text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = propulspace, public, pg_temp
AS $$
  SELECT
    ql.id, ql.full_name, ql.email, ql.phone, ql.company_name,
    ql.business_sector, ql.main_goal, ql.budget_range,
    ql.desired_timeline, ql.desired_features
  FROM propulspace.qualification_leads ql
  JOIN propulspace.onboarding_responses onb ON onb.inherited_from_qualification_id = ql.id
  WHERE onb.project_id = propulspace.portal_project_id()
  LIMIT 1;
$$;

REVOKE EXECUTE ON FUNCTION propulspace.portal_get_qualif_prefill() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION propulspace.portal_get_qualif_prefill() TO authenticated;

COMMENT ON FUNCTION propulspace.portal_get_qualif_prefill() IS
  'Renvoie les coordonnées qualif du projet portail courant pour pré-remplir le WelcomeWizard. Sécurisé par portal_project_id().';

CREATE OR REPLACE FUNCTION public.portal_get_qualif_prefill()
RETURNS TABLE(
  id uuid, full_name text, email text, phone text, company_name text,
  business_sector text, main_goal text, budget_range text,
  desired_timeline text, desired_features text[]
)
LANGUAGE sql STABLE SET search_path = public, pg_temp
AS $$ SELECT * FROM propulspace.portal_get_qualif_prefill(); $$;

REVOKE EXECUTE ON FUNCTION public.portal_get_qualif_prefill() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.portal_get_qualif_prefill() TO authenticated;
