-- propulspace 290 — SP4 : suppression de l'ancien chemin documents (FIN de SP4).
--
-- ⚠️⚠️ DIFFÉRÉ ~1 SEMAINE — NE PAS APPLIQUER TOUT DE SUITE. ⚠️⚠️
-- À jouer seulement après que :
--   1. la mig. 289 (backfill) est appliquée et vérifiée (0 doc manquant) ;
--   2. la bascule front (phase 3) tourne en prod sans régression ~1 semaine
--      (upload / download / delete / toggle CRM OK, portail vert).
--
-- Effet : clôt DÉFINITIVEMENT la faille anon de la vue 254 (déjà mitigée par le
-- hotfix 285) et retire la table legacy devenue silo mort après le backfill.
--
-- ⚠️ AVANT d'appliquer, faire le nettoyage front/types correspondant (sinon build cassé) :
--   - retirer `project_documents: 'project_documents_v2'` de V2_TABLE_MAP (src/lib/supabase.ts) ;
--   - retirer le bloc `project_documents_v2` de src/types/database.ts ;
--   - supprimer src/modules/ProjectsManagerV2/hooks/useDocumentsV2.ts (dead code, 0 import).
--   (Ces changements front ne sont PAS faits dans la PR SP4 : ils attendent cette migration.)
--
-- NE PAS toucher au bucket Storage `project-documents` : les fichiers physiques y
-- restent (conservé en lecture seule, routage via propulspace.documents.storage_bucket).

DROP VIEW  IF EXISTS public.project_documents_unified_v2;   -- clôt aussi définitivement la faille anon
DROP TABLE IF EXISTS public.project_documents_v2;
