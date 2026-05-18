-- ============================================================================
-- Migration 221 — Code review B.2 #1 : UNIQUE sur onboarding_responses.project_id
-- ============================================================================
-- Sans cette contrainte, le hook useOnboarding peut INSERT deux rows pour le
-- même projet si StrictMode (dev) ou si 2 onglets s'ouvrent en parallèle au
-- premier accès portail. La table n'a qu'un index non-unique sur project_id
-- (migration 050), donc rien n'empêche le doublon.
-- ============================================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'onboarding_responses_project_id_key'
      AND conrelid = 'propulspace.onboarding_responses'::regclass
  ) THEN
    DELETE FROM propulspace.onboarding_responses a
    USING propulspace.onboarding_responses b
    WHERE a.id < b.id AND a.project_id = b.project_id;

    ALTER TABLE propulspace.onboarding_responses
      ADD CONSTRAINT onboarding_responses_project_id_key UNIQUE (project_id);
  END IF;
END $$;
