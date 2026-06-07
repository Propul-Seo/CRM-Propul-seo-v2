-- propulspace_285_revoke_anon_documents_unified_view
--
-- Hotfix sécurité (indépendant de SP1/SP4).
--
-- La vue public.project_documents_unified_v2 (migration 254) a reçu un
-- `GRANT SELECT ... TO authenticated` mais AUCUN `REVOKE ... FROM anon`.
-- Or la règle maison (cf. migration 195) est que toute vue créée dans le
-- schéma `public` hérite d'un ACL `anon` par défaut. Conséquence : un client
-- NON authentifié (rôle anon) peut lire les métadonnées de TOUS les documents
-- (UNION ALL de project_documents_v2 + propulspace.documents) -> fuite.
--
-- Ce REVOKE est idempotent : no-op si anon n'a déjà aucun droit sur la vue.
-- Aucun impact sur le portail (qui lit via `authenticated` / vues client) ni
-- sur le CRM (session admin authentifiée).

REVOKE ALL ON public.project_documents_unified_v2 FROM anon;

-- Vérification (lecture seule, à exécuter après application) :
--   SELECT has_table_privilege('anon','public.project_documents_unified_v2','SELECT');
--   -> doit renvoyer `false`.
