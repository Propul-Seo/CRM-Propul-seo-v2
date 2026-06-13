-- R-015 : empêcher escalade privilèges via auto-attribution d'un user interne
-- dans l'audit trail propulspace.documents.uploaded_by.
-- Avant : aucune contrainte sur uploaded_by → un client portail pouvait inscrire
-- l'UUID d'un admin/dev pour brouiller la traçabilité.
-- Après : uploaded_by doit être NULL (anon/portail) OU = auth.uid() (admin agissant
-- explicitement pour lui-même).
DROP POLICY IF EXISTS ps_docs_client_insert ON propulspace.documents;
CREATE POLICY ps_docs_client_insert ON propulspace.documents
  FOR INSERT TO authenticated
  WITH CHECK (
    project_id = propulspace.portal_project_id()
    AND uploaded_by_client = true
    AND (uploaded_by IS NULL OR uploaded_by = auth.uid())
    AND deleted_at IS NULL
  );
