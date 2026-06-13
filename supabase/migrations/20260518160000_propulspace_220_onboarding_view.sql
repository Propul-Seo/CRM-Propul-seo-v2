-- ============================================================================
-- Migration 220 — Sprint B.2 : exposer onboarding_responses au portail
-- ============================================================================
-- - Ajoute la policy `ps_onboarding_client_insert` qui permet au client
--   portail de créer sa propre row (1re visite du wizard).
-- - Crée la vue `public.propulspace_onboarding_v2` (security_invoker=true)
--   pour exposer la table via PostgREST. REVOKE anon (cf leçon A.3.3),
--   GRANT SELECT/INSERT/UPDATE à authenticated.
-- ============================================================================

CREATE POLICY "ps_onboarding_client_insert" ON propulspace.onboarding_responses
  FOR INSERT TO authenticated
  WITH CHECK (project_id = propulspace.portal_project_id());

DROP VIEW IF EXISTS public.propulspace_onboarding_v2;
CREATE VIEW public.propulspace_onboarding_v2
  WITH (security_invoker = true) AS
  SELECT id, project_id, inherited_from_qualification_id,
    detailed_personas, brand_voice_notes, content_strategy,
    logo_uploaded, charter_uploaded, content_uploaded, legal_mentions_provided,
    has_provided_google_access, has_provided_hosting_access,
    has_provided_dns_access, has_provided_social_access,
    access_credentials_vault_id,
    completion_percent, is_complete, completed_at,
    kickoff_call_scheduled_at, kickoff_call_completed_at,
    created_at, updated_at
  FROM propulspace.onboarding_responses;

REVOKE ALL ON public.propulspace_onboarding_v2 FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.propulspace_onboarding_v2 TO authenticated;

COMMENT ON VIEW public.propulspace_onboarding_v2 IS
  'B.2 — vue portail onboarding_responses. RLS via portal_project_id() + is_admin().';
