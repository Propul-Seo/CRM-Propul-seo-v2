-- =============================================================================
-- 305 — LA BARRIÈRE : rôle de prospection soumis au RLS + policy opt-out
-- Date : 2026-07-13   (dépend de la migration 304)
-- -----------------------------------------------------------------------------
-- OBJECTIF : rendre l'oubli du filtre IMPOSSIBLE, pas seulement évitable.
-- Une requête de prospection qui oublie `WHERE opt_out = false` doit être
-- PHYSIQUEMENT incapable de retourner un désinscrit.
--
-- POURQUOI PAS `anon` (comme envisagé initialement) :
--   La clé anon est PUBLIQUE — vérifié le 2026-07-13 : elle est en clair dans le
--   bundle JS de https://crm.propulseo-site.com (assets/index-*.js). Accorder à
--   `anon` un SELECT sur contacts, même filtré sur opt_out = false, reviendrait à
--   publier tout le fichier prospects (noms, emails, téléphones) sur Internet :
--   n'importe qui peut extraire la clé et requêter PostgREST. Ce serait une
--   violation RGPD plus grave que celle qu'on corrige.
--
-- POURQUOI PAS `service_role` :
--   Elle BYPASSE le RLS par conception. Aucune policy, aucune vue ne l'arrête.
--   Les routines de prospection ne doivent JAMAIS l'utiliser.
--
-- SOLUTION : un rôle dédié `prospection`, à la fois
--   • soumis au RLS (contrairement à service_role), et
--   • secret (contrairement à anon) : son JWT est signé avec le secret du projet
--     et n'est distribué qu'à la routine Paperclip.
--
-- Verrouillage prod : néant. Que des GRANT/POLICY/CREATE VIEW (pas de réécriture
-- de table, pas de lock long). Tables de 393 et 15 lignes.
-- =============================================================================

-- --- 1. Le rôle de lecture dédié ---------------------------------------------
-- NOLOGIN : on ne s'y connecte pas directement, on l'endosse via un JWT
-- (claim "role": "prospection"). `authenticator` doit pouvoir l'endosser.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'prospection') THEN
    CREATE ROLE prospection NOLOGIN NOINHERIT;
  END IF;
END
$$;

GRANT prospection TO authenticator;
GRANT USAGE ON SCHEMA public TO prospection;

-- --- 2. Moindre privilège : SELECT sur les seules colonnes nécessaires --------
-- Pas de total_revenue, lead_score, notes, project_price... la routine n'en a
-- pas besoin. On n'expose que ce qui sert à prospecter + le drapeau opt_out.
GRANT SELECT (id, name, email, phone, company, sector, website, source, status, opt_out)
  ON public.contacts TO prospection;

GRANT SELECT (id, company_name, contact_name, email, phone, source, status, opt_out)
  ON public.crmerp_leads TO prospection;

-- --- 3. LA BARRIÈRE : le RLS ne laisse voir QUE les prospectables -------------
-- RLS est déjà activé sur les deux tables (vérifié : anon voit 0/393 lignes).
-- Ces policies sont ADDITIVES (permissives) : elles n'altèrent pas les policies
-- existantes de `authenticated` (les humains du CRM continuent de tout voir).
ALTER TABLE public.contacts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crmerp_leads  ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS prospection_sees_only_prospectables ON public.contacts;
CREATE POLICY prospection_sees_only_prospectables
  ON public.contacts
  FOR SELECT
  TO prospection
  USING (opt_out = false);

DROP POLICY IF EXISTS prospection_sees_only_prospectables ON public.crmerp_leads;
CREATE POLICY prospection_sees_only_prospectables
  ON public.crmerp_leads
  FOR SELECT
  TO prospection
  USING (opt_out = false);

-- Le rôle `prospection` ne peut QUE lire, et QUE des non-opt-out.
-- Aucune policy INSERT/UPDATE/DELETE ne lui est accordée : il ne peut rien écrire.

-- --- 3bis. LE VERROU : une policy RESTRICTIVE, non contournable -----------------
-- Les policies ci-dessus sont PERMISSIVES : elles s'additionnent en OR avec toutes
-- les autres permissives de la table. Or `contacts_select` est PERMISSIVE et ciblée
-- `TO public` — donc elle s'applique AUSSI au rôle `prospection`. Aujourd'hui elle
-- ne fuit pas (son USING vaut NULL quand auth.uid() est NULL, ce qui vaut refus),
-- mais la garantie tient par accident : un JWT prospection portant un `sub`
-- manager/admin, ou une future policy permissive `TO public`, rouvrirait l'accès
-- aux désinscrits SANS AUCUN SIGNAL.
--
-- Une policy RESTRICTIVE est ANDée avec le résultat de toutes les permissives.
-- Elle ne peut donc pas être contournée par ajout d'une permissive. C'est ELLE
-- qui rend l'oubli du filtre physiquement impossible, comme annoncé plus haut.
-- Ciblée `TO prospection` : aucun impact sur `authenticated` (les humains du CRM
-- continuent de voir tous les leads, opt-out compris, dans l'interface).
DROP POLICY IF EXISTS prospection_never_sees_optouts ON public.contacts;
CREATE POLICY prospection_never_sees_optouts
  ON public.contacts
  AS RESTRICTIVE
  FOR ALL
  TO prospection
  USING (opt_out = false);

DROP POLICY IF EXISTS prospection_never_sees_optouts ON public.crmerp_leads;
CREATE POLICY prospection_never_sees_optouts
  ON public.crmerp_leads
  AS RESTRICTIVE
  FOR ALL
  TO prospection
  USING (opt_out = false);

-- --- 4. Surface de lecture propre (confort, PAS la barrière) ------------------
-- security_invoker : la vue s'exécute avec les droits de l'appelant, donc le RLS
-- ci-dessus s'applique aussi à travers elle. Ce n'est PAS un contournement.
CREATE OR REPLACE VIEW public.contacts_prospectables
  WITH (security_invoker = true) AS
  SELECT id, name, email, phone, company, sector, website, source, status
  FROM public.contacts
  WHERE opt_out = false;

CREATE OR REPLACE VIEW public.crmerp_leads_prospectables
  WITH (security_invoker = true) AS
  SELECT id, company_name, contact_name, email, phone, source, status
  FROM public.crmerp_leads
  WHERE opt_out = false;

GRANT SELECT ON public.contacts_prospectables     TO prospection;
GRANT SELECT ON public.crmerp_leads_prospectables TO prospection;

-- --- 5. Fermeture de la clé PUBLIQUE `anon` sur CES objets --------------------
-- ⚠️ PORTÉE LIMITÉE, vérifié le 2026-07-13 : ce REVOKE ne ferme QUE les 4 objets
-- nommés ci-dessous. Il NE protège PAS les tables futures : `pg_default_acl`
-- accorde à `anon` (et authenticated, service_role) un `arwdDxtm` par défaut sur
-- toute table créée ensuite par postgres/supabase_admin dans `public`. Toute
-- nouvelle table PII sans `ENABLE ROW LEVEL SECURITY` sera donc lisible par la clé
-- publique. Le durcissement global (ALTER DEFAULT PRIVILEGES ... REVOKE FROM anon)
-- est un chantier distinct — voir la migration de durcissement 306.
-- Rappel : anon reste aussi lisible via la vue non-invoker `client_unified_v2`
-- (fuite latente, hors périmètre de cette table) — également traité en 306.
REVOKE ALL ON public.contacts     FROM anon;
REVOKE ALL ON public.crmerp_leads FROM anon;
REVOKE ALL ON public.contacts_prospectables     FROM anon;
REVOKE ALL ON public.crmerp_leads_prospectables FROM anon;

COMMENT ON VIEW public.contacts_prospectables IS
  'Leads Site Web contactables (opt_out = false). Lecture réservée au rôle `prospection` (JWT secret). La barrière réelle est la policy RLS, pas cette vue.';
COMMENT ON VIEW public.crmerp_leads_prospectables IS
  'Leads ERP contactables (opt_out = false). Lecture réservée au rôle `prospection` (JWT secret).';
