-- ============================================================================
-- Migration 200 — Sprint A.3.4 : durcir Storage propulspace-documents (R-008)
-- ============================================================================
-- Risque adressé : R-008 (🟠 Élevée) — fuite cross-tenant Storage.
--   Avant : la policy "ps_docs_storage_client_read" autorisait tout client
--   portail authentifié à SELECT n'importe quel objet du bucket — elle
--   vérifiait uniquement `portal_project_id() IS NOT NULL`, pas l'appartenance
--   du fichier au projet du caller. Mitigée en pratique par UUID imprévisibles
--   + signed URLs, mais la défense en profondeur exigeait le filtre.
--
-- Fix : ajouter `name LIKE portal_project_id()::text || '/%'` pour matcher
-- la convention de nommage `{project_id}/<file>` utilisée par DocumentsTabV3
-- ([src/modules/ProjectDetailsV3Preview/tabs/DocumentsTabV3.tsx:78]).
--
-- Pré-requis :
--   - Bucket `propulspace-documents` vide en prod au moment de la migration
--     (vérifié 2026-05-18). Aucun fichier orphelin à migrer.
--   - Seul uploader actif = DocumentsTabV3 (admin V3 CRM) qui respecte la
--     convention. `generate-quote-pdf` upload dans `devis` (bucket distinct).
--   - Tout futur uploader devra respecter `{project_id}/...` ou le client
--     ne pourra pas lire le fichier.
--
-- Note : la policy admin `ps_docs_storage_admin_all` reste inchangée
-- (admin peut tout lire/écrire). Les policies du bucket `propulspace-uploads`
-- (qualif anonyme, autres) ne sont pas touchées.
-- ============================================================================

DROP POLICY IF EXISTS "ps_docs_storage_client_read" ON storage.objects;

-- Note (post-review C-1) : le LIKE retourne NULL si portal_project_id() est NULL,
-- ce qui équivaut à FALSE en clause USING. Un seul appel de la fonction suffit.
CREATE POLICY "ps_docs_storage_client_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'propulspace-documents'
    AND name LIKE propulspace.portal_project_id()::text || '/%'
  );

-- ============================================================================
-- ROLLBACK (commenté — à exécuter manuellement si nécessaire)
-- ============================================================================
-- DROP POLICY IF EXISTS "ps_docs_storage_client_read" ON storage.objects;
-- CREATE POLICY "ps_docs_storage_client_read" ON storage.objects
--   FOR SELECT TO authenticated
--   USING (
--     bucket_id = 'propulspace-documents'
--     AND propulspace.portal_project_id() IS NOT NULL
--   );
