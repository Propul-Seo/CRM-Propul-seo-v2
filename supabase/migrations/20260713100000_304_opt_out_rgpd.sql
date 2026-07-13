-- =============================================================================
-- 304 — Opt-out RGPD sur les tables prospectables
-- Date : 2026-07-13
-- -----------------------------------------------------------------------------
-- Contexte : le CRM n'a AUCUN moyen de savoir qui s'est désinscrit. Tant que
-- c'est le cas, aucune routine de prospection ne peut légalement tourner
-- (RGPD art. 21 ; la CNIL exige de pouvoir prouver la DATE et le CANAL du retrait).
--
-- ⚠️ `status = 'perdu'` N'EST PAS un opt-out. Un lead perdu est recontactable ;
-- une personne désinscrite ne l'est JAMAIS. Deux notions distinctes, deux colonnes.
--
-- Verrouillage en prod : NÉGLIGEABLE.
--   • ADD COLUMN ... DEFAULT false NOT NULL ne réécrit PAS la table (PG >= 11 :
--     le défaut non-volatile est stocké en catalogue). PG 17.4 ici.
--   • Volumétrie : contacts ~393 lignes, crmerp_leads ~15. ACCESS EXCLUSIVE
--     de quelques millisecondes.
--   • L'index partiel est créé sans CONCURRENTLY (inutile à cette taille), ce qui
--     prend un SHARE lock bref sur des tables minuscules.
--
-- Cette migration ne fait qu'AJOUTER la donnée et sa preuve. Elle ne constitue
-- PAS la barrière : une colonne ne protège de rien si une requête oublie de la
-- lire. La barrière (RLS / rôle de lecture dédié) fait l'objet de la migration 305.
-- =============================================================================

-- --- contacts (pipeline Site Web) --------------------------------------------
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS opt_out        boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS opt_out_at     timestamptz,
  ADD COLUMN IF NOT EXISTS opt_out_source text;

COMMENT ON COLUMN public.contacts.opt_out IS
  'RGPD art.21 : la personne s''est opposée à la prospection. Irréversible en pratique. NE PAS confondre avec status=''perdu'' (recontactable).';
COMMENT ON COLUMN public.contacts.opt_out_at IS
  'Date du retrait — preuve exigée en cas de contrôle CNIL. Obligatoire si opt_out = true.';
COMMENT ON COLUMN public.contacts.opt_out_source IS
  'Canal du retrait : lien de désinscription, réponse mail, demande directe, import, téléphone...';

-- Cohérence : pas d'opt-out sans date. Sans ça, la preuve est inopposable.
ALTER TABLE public.contacts
  DROP CONSTRAINT IF EXISTS contacts_opt_out_requires_date;
ALTER TABLE public.contacts
  ADD CONSTRAINT contacts_opt_out_requires_date
  CHECK (opt_out = false OR opt_out_at IS NOT NULL);

-- Index partiel : les requêtes de prospection ne lisent QUE les prospectables.
-- L'index sert ce chemin (opt_out = false), pas l'autre.
CREATE INDEX IF NOT EXISTS idx_contacts_email_prospectable
  ON public.contacts (email)
  WHERE opt_out = false;


-- --- crmerp_leads (pipeline ERP) ---------------------------------------------
ALTER TABLE public.crmerp_leads
  ADD COLUMN IF NOT EXISTS opt_out        boolean     NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS opt_out_at     timestamptz,
  ADD COLUMN IF NOT EXISTS opt_out_source text;

COMMENT ON COLUMN public.crmerp_leads.opt_out IS
  'RGPD art.21 : la personne s''est opposée à la prospection. NE PAS confondre avec un statut de pipeline.';
COMMENT ON COLUMN public.crmerp_leads.opt_out_at IS
  'Date du retrait — preuve exigée en cas de contrôle CNIL. Obligatoire si opt_out = true.';
COMMENT ON COLUMN public.crmerp_leads.opt_out_source IS
  'Canal du retrait : lien de désinscription, réponse mail, demande directe, import, téléphone...';

ALTER TABLE public.crmerp_leads
  DROP CONSTRAINT IF EXISTS crmerp_leads_opt_out_requires_date;
ALTER TABLE public.crmerp_leads
  ADD CONSTRAINT crmerp_leads_opt_out_requires_date
  CHECK (opt_out = false OR opt_out_at IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_crmerp_leads_email_prospectable
  ON public.crmerp_leads (email)
  WHERE opt_out = false;
