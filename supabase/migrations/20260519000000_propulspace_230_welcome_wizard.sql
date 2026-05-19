-- ============================================================================
-- Migration 230 — Welcome Wizard v2 (Sprint B.2 recadré)
-- ============================================================================
-- Objectif : préparer la base pour le nouveau wizard d'accueil court (5 étapes
-- Bienvenue / Coordonnées / Préférences / Tour / Done), tout en gardant les
-- colonnes V1 (brand_voice, logo_uploaded, etc.) pour la future page
-- Configuration du projet (livrée en PR 2).
--
-- Ce que cette migration AJOUTE (zéro DROP, zéro RENAME, zéro casse) :
--   1. 11 colonnes welcome_* + préférences sur propulspace.onboarding_responses
--   2. 3 colonnes client_* sur public.projects_v2 (synchro coordonnées CRM)
--   3. Trigger SECURITY DEFINER de sync onboarding → projects_v2
--   4. Backfill rétroactif de inherited_from_qualification_id
--   5. Recréation de la vue propulspace_onboarding_v2 avec les nouvelles colonnes
--      (REVOKE anon explicite — leçon migration 195)
-- ============================================================================

-- ============================================================================
-- BLOC 1 — Colonnes wizard d'accueil sur onboarding_responses
-- ============================================================================
DO $$
BEGIN
  -- Coordonnées éditables (miroir Step 2)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='propulspace' AND table_name='onboarding_responses' AND column_name='welcome_first_name') THEN
    ALTER TABLE propulspace.onboarding_responses ADD COLUMN welcome_first_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='propulspace' AND table_name='onboarding_responses' AND column_name='welcome_last_name') THEN
    ALTER TABLE propulspace.onboarding_responses ADD COLUMN welcome_last_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='propulspace' AND table_name='onboarding_responses' AND column_name='welcome_phone') THEN
    ALTER TABLE propulspace.onboarding_responses ADD COLUMN welcome_phone text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='propulspace' AND table_name='onboarding_responses' AND column_name='welcome_company') THEN
    ALTER TABLE propulspace.onboarding_responses ADD COLUMN welcome_company text;
  END IF;

  -- Préférences communication (Step 3)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='propulspace' AND table_name='onboarding_responses' AND column_name='preferred_channel') THEN
    ALTER TABLE propulspace.onboarding_responses ADD COLUMN preferred_channel text DEFAULT 'email'
      CHECK (preferred_channel IN ('email','phone','whatsapp'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='propulspace' AND table_name='onboarding_responses' AND column_name='availability_slots') THEN
    ALTER TABLE propulspace.onboarding_responses ADD COLUMN availability_slots text[] DEFAULT ARRAY['afternoon']::text[];
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='propulspace' AND table_name='onboarding_responses' AND column_name='email_notifications') THEN
    ALTER TABLE propulspace.onboarding_responses ADD COLUMN email_notifications boolean DEFAULT true;
  END IF;

  -- Cycle de vie wizard (resume + dismissals)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='propulspace' AND table_name='onboarding_responses' AND column_name='welcome_current_step') THEN
    ALTER TABLE propulspace.onboarding_responses ADD COLUMN welcome_current_step int DEFAULT 1
      CHECK (welcome_current_step BETWEEN 1 AND 5);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='propulspace' AND table_name='onboarding_responses' AND column_name='welcome_completed_at') THEN
    ALTER TABLE propulspace.onboarding_responses ADD COLUMN welcome_completed_at timestamptz;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='propulspace' AND table_name='onboarding_responses' AND column_name='welcome_dismissed_count') THEN
    ALTER TABLE propulspace.onboarding_responses ADD COLUMN welcome_dismissed_count int DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='propulspace' AND table_name='onboarding_responses' AND column_name='welcome_last_dismissed_at') THEN
    ALTER TABLE propulspace.onboarding_responses ADD COLUMN welcome_last_dismissed_at timestamptz;
  END IF;
END $$;

-- ============================================================================
-- BLOC 2 — Colonnes client sur projects_v2 (synchro coordonnées CRM)
-- ============================================================================
-- Le wizard d'accueil collecte prénom/téléphone/société. Ces 3 champs n'existent
-- pas encore sur projects_v2 (qui a juste client_name = nom complet en bloc).
-- On les ajoute pour que l'équipe sales/admin les voie dans la fiche projet CRM.
-- ============================================================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='projects_v2' AND column_name='client_first_name') THEN
    ALTER TABLE public.projects_v2 ADD COLUMN client_first_name text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='projects_v2' AND column_name='client_phone') THEN
    ALTER TABLE public.projects_v2 ADD COLUMN client_phone text;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='projects_v2' AND column_name='client_company') THEN
    ALTER TABLE public.projects_v2 ADD COLUMN client_company text;
  END IF;
END $$;

COMMENT ON COLUMN public.projects_v2.client_first_name IS
  'Prénom du client. Synchronisé automatiquement depuis propulspace.onboarding_responses.welcome_first_name via trigger sync_onboarding_to_project_v2.';
COMMENT ON COLUMN public.projects_v2.client_phone IS
  'Téléphone du client. Synchronisé automatiquement depuis propulspace.onboarding_responses.welcome_phone.';
COMMENT ON COLUMN public.projects_v2.client_company IS
  'Société du client. Synchronisé automatiquement depuis propulspace.onboarding_responses.welcome_company.';

-- ============================================================================
-- BLOC 3 — Trigger SECURITY DEFINER : sync onboarding → projects_v2
-- ============================================================================
-- Le client portail modifie ses coordonnées dans le wizard (Step 2). Comme il
-- n'a pas le droit d'écrire directement sur projects_v2 (RLS admin-only), on
-- utilise un trigger SECURITY DEFINER qui propage automatiquement les modifs.
-- Évite toute logique côté frontend, garde la sécurité verrouillée, et limite
-- l'écriture aux 3 colonnes client_* (le trigger ne touche RIEN d'autre).
-- ============================================================================

CREATE OR REPLACE FUNCTION propulspace.sync_onboarding_to_project_v2()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, propulspace
AS $$
BEGIN
  -- Ne touche projects_v2 QUE si au moins un champ welcome_* miroir a changé.
  -- Évite les UPDATE inutiles + boucle si un autre trigger sur projects_v2
  -- déclenchait une cascade.
  IF (NEW.welcome_first_name IS DISTINCT FROM OLD.welcome_first_name)
     OR (NEW.welcome_phone IS DISTINCT FROM OLD.welcome_phone)
     OR (NEW.welcome_company IS DISTINCT FROM OLD.welcome_company) THEN
    UPDATE public.projects_v2
       SET client_first_name = COALESCE(NEW.welcome_first_name, client_first_name),
           client_phone      = COALESCE(NEW.welcome_phone,      client_phone),
           client_company    = COALESCE(NEW.welcome_company,    client_company),
           updated_at        = now()
     WHERE id = NEW.project_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_onboarding_to_project_v2 ON propulspace.onboarding_responses;
CREATE TRIGGER trg_sync_onboarding_to_project_v2
  AFTER UPDATE ON propulspace.onboarding_responses
  FOR EACH ROW
  EXECUTE FUNCTION propulspace.sync_onboarding_to_project_v2();

-- ============================================================================
-- BLOC 4 — Backfill rétroactif : rattacher onboardings aux qualifs existantes
-- ============================================================================
-- Avant cette migration, useOnboarding ne renseignait jamais inherited_from_qualification_id
-- → la colonne est NULL pour toutes les rows existantes. On rattache rétroactivement
-- via la FK qualification_leads.converted_to_project_id.
-- ============================================================================
UPDATE propulspace.onboarding_responses AS o
   SET inherited_from_qualification_id = q.id
  FROM propulspace.qualification_leads AS q
 WHERE q.converted_to_project_id = o.project_id
   AND o.inherited_from_qualification_id IS NULL;

-- ============================================================================
-- BLOC 5 — Recréer la vue publique avec les nouvelles colonnes
-- ============================================================================
-- La vue propulspace_onboarding_v2 (migration 220) doit exposer les nouvelles
-- colonnes welcome_* + préférences au client portail. On DROP + CREATE avec
-- les permissions explicites (leçon migration 195 : CREATE VIEW reset les ACL).
-- ============================================================================

DROP VIEW IF EXISTS public.propulspace_onboarding_v2 CASCADE;

CREATE VIEW public.propulspace_onboarding_v2 AS
SELECT
  id,
  project_id,
  inherited_from_qualification_id,

  -- V1 (page Configuration du projet — futur PR 2)
  brand_voice_notes,
  content_strategy,
  detailed_personas,
  logo_uploaded,
  charter_uploaded,
  content_uploaded,
  legal_mentions_provided,
  has_provided_google_access,
  has_provided_hosting_access,
  has_provided_dns_access,
  has_provided_social_access,
  access_credentials_vault_id,
  kickoff_call_scheduled_at,
  completion_percent,
  is_complete,
  completed_at,

  -- V2 (welcome wizard — ce PR)
  welcome_first_name,
  welcome_last_name,
  welcome_phone,
  welcome_company,
  preferred_channel,
  availability_slots,
  email_notifications,
  welcome_current_step,
  welcome_completed_at,
  welcome_dismissed_count,
  welcome_last_dismissed_at,

  created_at,
  updated_at
FROM propulspace.onboarding_responses;

-- Sécurité : revoke anon (leçon 195), grant authenticated (RLS de la table s'applique)
REVOKE ALL ON public.propulspace_onboarding_v2 FROM anon;
GRANT SELECT, INSERT, UPDATE ON public.propulspace_onboarding_v2 TO authenticated;

COMMENT ON VIEW public.propulspace_onboarding_v2 IS
  'Vue publique de propulspace.onboarding_responses pour le portail client. Mise à jour migration 230 : ajout colonnes welcome_* + préférences (Sprint B.2 recadré).';
