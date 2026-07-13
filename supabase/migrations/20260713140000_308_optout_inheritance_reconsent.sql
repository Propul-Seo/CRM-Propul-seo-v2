-- =============================================================================
-- 308 — Anti-résurrection : héritage opt-out tous chemins + re-consentement humain
-- Date : 2026-07-13   (dépend de 304)
-- -----------------------------------------------------------------------------
-- ASYMÉTRIE STRICTE (règle métier) :
--   • La MACHINE peut fermer la porte : n'importe quelle écriture (UI, import, API,
--     agent, psql) portant l'e-mail d'un désinscrit hérite opt_out = true,
--     SILENCIEUSEMENT. Personne ne renaît « propre » par accident. Non contournable
--     par un INSERT/UPDATE ordinaire.
--   • Seul un HUMAIN peut la rouvrir, et il doit dire pourquoi : le re-consentement
--     n'est PAS un INSERT/UPDATE ordinaire. C'est une action dédiée (reconsent_lead)
--     qui exige une preuve (consent_at + consent_source), réservée aux humains
--     authentifiés (manager/admin), JAMAIS exposée à la passerelle des agents.
--
-- Un agent peut désinscrire (protéger), jamais réinscrire (exposer).
-- =============================================================================

-- --- 1. Traçabilité du re-consentement ---------------------------------------
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS consent_at     timestamptz,
  ADD COLUMN IF NOT EXISTS consent_source text;
ALTER TABLE public.crmerp_leads
  ADD COLUMN IF NOT EXISTS consent_at     timestamptz,
  ADD COLUMN IF NOT EXISTS consent_source text;

COMMENT ON COLUMN public.contacts.consent_at IS
  'Date du re-consentement (levée d''opt-out). Renseignée UNIQUEMENT via reconsent_lead(). Preuve exigée par la CNIL.';
COMMENT ON COLUMN public.contacts.consent_source IS
  'Base du re-consentement : formulaire re-signé, réponse écrite... Obligatoire pour lever un opt-out.';

-- Index pour la recherche d'identité désinscrite par e-mail (insensible à la casse).
CREATE INDEX IF NOT EXISTS idx_contacts_lower_email_optout
  ON public.contacts (lower(email)) WHERE opt_out;
CREATE INDEX IF NOT EXISTS idx_crmerp_leads_lower_email_optout
  ON public.crmerp_leads (lower(email)) WHERE opt_out;

-- --- 2. Le verrou : trigger BEFORE INSERT/UPDATE -----------------------------
-- SECURITY DEFINER (owner postgres, bypassrls) : l'EXISTS voit TOUTES les lignes
-- désinscrites, quel que soit le RLS de l'appelant.
CREATE OR REPLACE FUNCTION public.enforce_optout_inheritance()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_suppressed boolean := false;
BEGIN
  IF NEW.email IS NOT NULL AND btrim(NEW.email) <> '' THEN
    SELECT EXISTS (
      SELECT 1 FROM public.contacts     WHERE opt_out AND lower(email) = lower(NEW.email)
      UNION ALL
      SELECT 1 FROM public.crmerp_leads WHERE opt_out AND lower(email) = lower(NEW.email)
    ) INTO v_suppressed;
  END IF;

  -- (a) Tentative de LEVÉE d'un opt-out (true -> false) sur une ligne existante.
  --     Autorisée UNIQUEMENT avec une preuve de re-consentement FRAÎCHE, posée
  --     dans CETTE écriture (donc via reconsent_lead). Sinon, on RE-FERME.
  IF TG_OP = 'UPDATE' AND OLD.opt_out AND NOT NEW.opt_out THEN
    IF NEW.consent_at IS NOT NULL
       AND NEW.consent_source IS NOT NULL AND btrim(NEW.consent_source) <> ''
       AND NEW.consent_at IS DISTINCT FROM OLD.consent_at THEN
      RETURN NEW;  -- re-consentement valide : la levée passe
    END IF;
    NEW.opt_out        := true;  -- pas de preuve : le verrou tient
    NEW.opt_out_at     := COALESCE(NEW.opt_out_at, OLD.opt_out_at, now());
    NEW.opt_out_source := COALESCE(NEW.opt_out_source, OLD.opt_out_source, 'verrou:levee sans consentement');
    RETURN NEW;
  END IF;

  -- (b) INSERT (ou UPDATE sans levée) d'une identité déjà désinscrite ailleurs :
  --     héritage silencieux. Le re-consentement ne passe JAMAIS par un INSERT.
  IF v_suppressed AND NOT NEW.opt_out THEN
    NEW.opt_out        := true;
    NEW.opt_out_at     := COALESCE(NEW.opt_out_at, now());
    NEW.opt_out_source := COALESCE(NEW.opt_out_source, 'herite:opt-out anterieur');
  END IF;

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.enforce_optout_inheritance() IS
  'Verrou anti-résurrection : toute écriture portant l''e-mail d''un désinscrit hérite opt_out=true. Une levée n''est acceptée qu''avec un re-consentement frais (via reconsent_lead).';

DROP TRIGGER IF EXISTS trg_optout_inheritance ON public.contacts;
CREATE TRIGGER trg_optout_inheritance
  BEFORE INSERT OR UPDATE ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.enforce_optout_inheritance();

DROP TRIGGER IF EXISTS trg_optout_inheritance ON public.crmerp_leads;
CREATE TRIGGER trg_optout_inheritance
  BEFORE INSERT OR UPDATE ON public.crmerp_leads
  FOR EACH ROW EXECUTE FUNCTION public.enforce_optout_inheritance();

-- --- 3. Le SEUL chemin de levée : reconsent_lead (humain authentifié) ---------
-- Lève l'opt-out de TOUTES les lignes portant l'e-mail (site + erp) et estampille
-- la preuve. Réservé aux humains manager/admin : is_manager_or_admin() renvoie
-- NULL/false pour service_role (pas d'auth.uid()), donc la passerelle des agents
-- ne peut PAS l'appeler avec succès.
CREATE OR REPLACE FUNCTION public.reconsent_lead(p_pipeline text, p_id uuid, p_source text)
  RETURNS integer
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path = ''
AS $$
DECLARE
  v_email text;
  v_n     integer := 0;
BEGIN
  -- Contrôle manager/admin INTERNALISÉ (public.users qualifié) : on ne dépend pas
  -- de is_manager_or_admin(), qui référence `users` sans schéma et casserait sous
  -- search_path=''. Pas d'auth.uid() (service_role/postgres) => aucune ligne => refus.
  IF NOT EXISTS (
    SELECT 1 FROM public.users
     WHERE auth_user_id = auth.uid()
       AND (role IN ('admin','manager') OR email = 'team@propulseo-site.com')
  ) THEN
    RAISE EXCEPTION 'Re-consentement réservé aux humains authentifiés (manager/admin).';
  END IF;
  IF p_source IS NULL OR btrim(p_source) = '' THEN
    RAISE EXCEPTION 'consent_source obligatoire (preuve du re-consentement).';
  END IF;

  IF p_pipeline = 'site' THEN
    SELECT email INTO v_email FROM public.contacts WHERE id = p_id;
  ELSIF p_pipeline = 'erp' THEN
    SELECT email INTO v_email FROM public.crmerp_leads WHERE id = p_id;
  ELSE
    RAISE EXCEPTION 'pipeline invalide (site|erp).';
  END IF;
  IF v_email IS NULL OR btrim(v_email) = '' THEN
    RAISE EXCEPTION 'Lead introuvable ou sans e-mail : levée impossible.';
  END IF;

  WITH a AS (
    UPDATE public.contacts
       SET opt_out = false, consent_at = now(), consent_source = p_source
     WHERE lower(email) = lower(v_email) AND opt_out
     RETURNING 1
  ), b AS (
    UPDATE public.crmerp_leads
       SET opt_out = false, consent_at = now(), consent_source = p_source
     WHERE lower(email) = lower(v_email) AND opt_out
     RETURNING 1
  )
  SELECT (SELECT count(*) FROM a) + (SELECT count(*) FROM b) INTO v_n;

  RETURN v_n;
END;
$$;

COMMENT ON FUNCTION public.reconsent_lead(text, uuid, text) IS
  'Lève l''opt-out d''une identité (toutes ses lignes site+erp) avec preuve. Humains manager/admin uniquement ; jamais exposé aux agents.';

-- Exécutable par les humains authentifiés (la fonction filtre elle-même manager/admin).
REVOKE ALL ON FUNCTION public.reconsent_lead(text, uuid, text) FROM PUBLIC, anon, prospection;
GRANT EXECUTE ON FUNCTION public.reconsent_lead(text, uuid, text) TO authenticated;
