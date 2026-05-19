-- ============================================================================
-- Migration 233 — Fix trigger sync : assignation directe (vs COALESCE)
-- ============================================================================
-- Bug remonté en code review : COALESCE(NEW.welcome_first_name, client_first_name)
-- garde silencieusement l'ancienne valeur si le client efface volontairement
-- son prénom (set à NULL). Désync persistante entre onboarding et projects_v2.
--
-- Fix : assignation directe de NEW. Le trigger ne s'exécute que si au moins
-- une des 3 colonnes welcome_* a changé (IS DISTINCT FROM OLD), donc on est
-- toujours dans un cas légitime d'écriture, y compris l'effacement volontaire.
-- ============================================================================
CREATE OR REPLACE FUNCTION propulspace.sync_onboarding_to_project_v2()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, propulspace
AS $$
BEGIN
  IF (NEW.welcome_first_name IS DISTINCT FROM OLD.welcome_first_name)
     OR (NEW.welcome_phone IS DISTINCT FROM OLD.welcome_phone)
     OR (NEW.welcome_company IS DISTINCT FROM OLD.welcome_company) THEN
    UPDATE public.projects_v2
       SET client_first_name = NEW.welcome_first_name,
           client_phone      = NEW.welcome_phone,
           client_company    = NEW.welcome_company,
           updated_at        = now()
     WHERE id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$;
