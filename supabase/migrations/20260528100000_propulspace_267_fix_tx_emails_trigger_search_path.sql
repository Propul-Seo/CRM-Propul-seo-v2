-- 267 — Hardening : ajoute SET search_path explicite sur tx_emails_set_updated_at
-- Corrige l'advisor function_search_path_mutable (WARN) sur la fonction trigger
-- créée par la migration 264. Aucune modif logique, juste durcissement sécu.

CREATE OR REPLACE FUNCTION propulspace.tx_emails_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = pg_catalog, pg_temp
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END $$;

COMMENT ON FUNCTION propulspace.tx_emails_set_updated_at() IS
  'Trigger updated_at de transactional_emails_sent. search_path durci (advisor 267).';
