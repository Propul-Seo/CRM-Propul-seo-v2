-- =============================================================================
-- Migration : propulspace_160_portal_activation_metadata
-- Sprint A.2a — Câblage UI "Activer le portail" sur fiche projet V3
-- =============================================================================
--
-- Objectif : permettre à l'admin d'activer/désactiver le portail client depuis
-- l'UI CRM (ProjectDetailsV3Preview) plutôt qu'en SQL manuel.
--
-- Contexte : les colonnes portal_activated_at, portal_deactivated_at,
-- portal_deactivation_reason existent déjà (migration 020) mais ne sont pas
-- câblées. Cette migration complète le set et ajoute le filet de sécurité DB.
--
-- =============================================================================
-- 1) Nouvelles colonnes (ADD IF NOT EXISTS — idempotent)
-- =============================================================================
--
-- portal_activated_by              : qui a activé le portail (admin uid)
-- portal_last_invite_sent_at       : timestamp dernier envoi d'invitation
-- portal_previous_client_email     : ancien email après désactivation
--                                    (utile si on réactive avec un autre client)
-- =============================================================================

ALTER TABLE public.projects_v2
  ADD COLUMN IF NOT EXISTS portal_activated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS portal_last_invite_sent_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS portal_previous_client_email TEXT;

COMMENT ON COLUMN public.projects_v2.portal_activated_by IS
  'Admin qui a activé le portail (référence auth.users). NULL si activé via SQL manuel.';
COMMENT ON COLUMN public.projects_v2.portal_last_invite_sent_at IS
  'Timestamp du dernier envoi d''invitation Supabase Auth (inviteUserByEmail).';
COMMENT ON COLUMN public.projects_v2.portal_previous_client_email IS
  'Dernier email client actif avant désactivation. Permet de tracer l''historique sans audit_log lookup.';

-- =============================================================================
-- 2) Index sur portal_client_email (résout R-009)
-- =============================================================================
--
-- portal_project_id() fait un lookup WHERE portal_client_email = ... à chaque
-- requête portail. Sans index = scan séquentiel.
-- =============================================================================

CREATE INDEX IF NOT EXISTS idx_projects_v2_portal_client_email
  ON public.projects_v2(portal_client_email)
  WHERE portal_client_email IS NOT NULL;

-- =============================================================================
-- 3) Filet de sécurité DB : trigger BEFORE UPDATE
-- =============================================================================
--
-- La policy actuelle (authenticated_all_projects_v2 USING true WITH CHECK true)
-- laisse tout user authentifié modifier projects_v2. Refonte complète des
-- policies = Sprint A.3.
--
-- Ici, on protège chirurgicalement les colonnes portal_* : un user non-admin
-- ne peut pas les modifier. L'edge function admin-portal-invite exécute l'UPDATE
-- avec le JWT user (pas service_role) pour que is_admin() s'évalue correctement.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.guard_portal_columns_admin_only()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    IF NEW.portal_client_email           IS DISTINCT FROM OLD.portal_client_email
    OR NEW.portal_activated_at           IS DISTINCT FROM OLD.portal_activated_at
    OR NEW.portal_activated_by           IS DISTINCT FROM OLD.portal_activated_by
    OR NEW.portal_last_invite_sent_at    IS DISTINCT FROM OLD.portal_last_invite_sent_at
    OR NEW.portal_deactivated_at         IS DISTINCT FROM OLD.portal_deactivated_at
    OR NEW.portal_deactivation_reason    IS DISTINCT FROM OLD.portal_deactivation_reason
    OR NEW.portal_previous_client_email  IS DISTINCT FROM OLD.portal_previous_client_email
    THEN
      RAISE EXCEPTION 'Only admins can modify portal_* columns on projects_v2'
        USING ERRCODE = '42501';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.guard_portal_columns_admin_only() IS
  'Trigger guard : bloque toute modif des colonnes portal_* sur projects_v2 si l''auteur n''est pas admin (is_admin() = false). Edge function admin-portal-invite doit utiliser le JWT user pour passer ce guard.';

DROP TRIGGER IF EXISTS trg_guard_portal_columns_admin_only ON public.projects_v2;
CREATE TRIGGER trg_guard_portal_columns_admin_only
  BEFORE UPDATE ON public.projects_v2
  FOR EACH ROW
  EXECUTE FUNCTION public.guard_portal_columns_admin_only();

-- Trigger function : pas d'usage RPC légitime, on révoque les EXECUTE
-- (sinon Supabase advisor râle car SECURITY DEFINER + exposé /rest/v1/rpc).
REVOKE EXECUTE ON FUNCTION public.guard_portal_columns_admin_only() FROM anon, authenticated, public;

-- =============================================================================
-- Notes pour le rollback (si besoin)
-- =============================================================================
-- DROP TRIGGER trg_guard_portal_columns_admin_only ON public.projects_v2;
-- DROP FUNCTION public.guard_portal_columns_admin_only();
-- DROP INDEX idx_projects_v2_portal_client_email;
-- ALTER TABLE public.projects_v2
--   DROP COLUMN portal_activated_by,
--   DROP COLUMN portal_last_invite_sent_at,
--   DROP COLUMN portal_previous_client_email;
-- =============================================================================
