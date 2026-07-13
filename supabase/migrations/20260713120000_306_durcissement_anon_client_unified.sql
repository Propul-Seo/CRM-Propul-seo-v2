-- =============================================================================
-- 306 — Durcissement : fermer les portes de service que 305 laisse ouvertes
-- Date : 2026-07-13   (dépend de 304/305)   —   NON APPLIQUÉE, à revoir
-- -----------------------------------------------------------------------------
-- L'audit adversarial du 2026-07-13 (5 vecteurs, 15 agents) a établi que la
-- barrière `prospection` de 305 est hermétique POUR CE RÔLE, mais qu'il subsiste
-- des chemins latéraux par lesquels la clé PUBLIQUE `anon` peut, à terme, lire
-- des PII de leads — RLS contourné. Aucun n'est une fuite LIVE aujourd'hui
-- (0 ligne exposée), mais chacun s'arme tout seul dès que la donnée arrive.
--
-- Ce fichier ferme le trou NON-CONTROVERSÉ (client_unified_v2, vue morte).
-- Le durcissement des DEFAULT PRIVILEGES est laissé en fin de fichier, COMMENTÉ,
-- car il change la posture par défaut du projet (voir la note) : à activer sur
-- décision explicite.
-- =============================================================================

-- --- 1. client_unified_v2 : vue non-invoker accordée à anon -------------------
-- Constat : owner=postgres (rolbypassrls=true) + reloptions sans security_invoker
--   => la vue s'exécute avec les droits de postgres et CONTOURNE le RLS de
--   contacts. Elle lit email/nom/tél/entreprise via JOIN project_contacts
--   role='primary', SANS filtre opt_out. `anon` détient le SELECT dessus.
-- Aujourd'hui : 0 ligne (aucun project_contacts 'primary'). Latent : le premier
--   contact opt_out=true devenu contact primaire d'un projet serait lisible en
--   clair par la clé publique.
-- Vérifié : la vue est DÉFINIE (migration 286) mais JAMAIS requêtée par le front
--   (aucun `.from('client_unified_v2')`, type `ClientUnified` non importé).
--   Les deux corrections sont donc sans impact fonctionnel.
--
-- On NE met PAS de filtre opt_out dans la vue : elle décrit des CLIENTS (contacts
-- primaires de projets), pas une cible de prospection. Un client qui s'est opposé
-- à la PROSPECTION reste un client qu'on sert. La bonne barrière ici, c'est que la
-- vue respecte le RLS de l'appelant — d'où security_invoker.

-- (a) La vue respecte désormais le RLS de l'appelant (defense in depth : même
--     re-grantée un jour, elle n'exposera que ce que l'appelant a le droit de voir).
ALTER VIEW public.client_unified_v2 SET (security_invoker = true);

-- (b) La clé publique anon n'a aucun besoin légitime de cette vue.
REVOKE ALL ON public.client_unified_v2 FROM anon;

COMMENT ON VIEW public.client_unified_v2 IS
  'Identité client unifiée (SP1). security_invoker=true : respecte le RLS de l''appelant. anon révoqué (2026-07-13, migration 306) — ne pas re-grant à anon.';


-- --- 2. contact_activities / crmerp_activities : grants anon dormants ---------
-- `anon` détient des grants table pleins (SELECT/INSERT/UPDATE/DELETE) hérités du
-- default ACL. Neutralisés aujourd'hui par le RLS (aucune policy permissive TO
-- anon/public), mais le RLS n'est pas FORCÉ : une future policy permissive
-- TO public rouvrirait tout. Moindre privilège : on retire ces grants.
-- (Sans impact : le front lit ces tables en `authenticated`, jamais en anon —
--  et la clé anon legacy est de toute façon désactivée au niveau projet.)
REVOKE ALL ON public.contact_activities FROM anon;
REVOKE ALL ON public.crmerp_activities  FROM anon;


-- --- 3. (OPTIONNEL — décision de posture) DEFAULT PRIVILEGES ------------------
-- Constat : pg_default_acl accorde à `anon` (et authenticated, service_role) un
--   arwdDxtm par défaut sur TOUTE table future créée par postgres/supabase_admin
--   dans `public`. Donc la prochaine table PII créée sans `ENABLE ROW LEVEL
--   SECURITY` sera lisible par la clé publique — quel que soit le REVOKE de 305.
--
-- ⚠️ CE N'EST PAS UN NO-OP DE POSTURE. C'est la convention Supabase par défaut :
--   « je crée une table, PostgREST l'expose ». La révoquer = "secure by default"
--   MAIS il faudra désormais un GRANT explicite sur CHAQUE nouvelle table destinée
--   à être exposée, sinon le front la verra en 401. À n'activer qu'en connaissance
--   de cause. `ALTER DEFAULT PRIVILEGES` ne modifie QUE les défauts du rôle qui
--   l'exécute — postgres ici ; l'entrée owner=supabase_admin devrait être traitée
--   séparément (nécessite d'endosser supabase_admin).
--
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public REVOKE ALL ON TABLES FROM anon;
-- -- (et, si souhaité, idem pour le schéma v2 qui a lui aussi anon=arwd)
