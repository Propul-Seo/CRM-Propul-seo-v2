-- ============================================================================
-- Migration 201 — Code review C-1 : simplifier la policy Storage
-- ============================================================================
-- Suite à la review post-migration 200, simplifier la policy en supprimant
-- la redondance `portal_project_id() IS NOT NULL` :
--   - `name LIKE NULL || '/%'` retourne NULL en SQL.
--   - NULL en clause USING équivaut à FALSE → la row est filtrée.
-- Donc un seul appel de la fonction suffit ; double appel = bug latent
-- si la fonction change de classification VOLATILE/STABLE.
-- ============================================================================

DROP POLICY IF EXISTS "ps_docs_storage_client_read" ON storage.objects;

CREATE POLICY "ps_docs_storage_client_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'propulspace-documents'
    AND name LIKE propulspace.portal_project_id()::text || '/%'
  );
