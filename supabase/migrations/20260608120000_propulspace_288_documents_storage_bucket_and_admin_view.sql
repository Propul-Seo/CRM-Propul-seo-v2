-- propulspace 288 — SP4 : storage_bucket sur propulspace.documents + vue admin avec `bucket`.
--
-- Prérequis BLOQUANT des phases 3-4 de SP4. La vue admin de la mig. 281 n'expose
-- PAS de colonne `bucket` : sans elle, le download CRM casse dès qu'on bascule la
-- lecture sur cette vue. On ajoute donc :
--   1. propulspace.documents.storage_bucket (NULL => bucket inféré depuis file_url ;
--      renseigné = 'project-documents' pour les docs CRM rapatriés au backfill).
--   2. propulspace_documents_admin_v2 RECRÉÉE avec
--      bucket = COALESCE(storage_bucket, <CASE inférence mig.254>).
-- RLS via security_invoker (is_admin). Ne PAS toucher aux vues client.
-- ⚠️ À APPLIQUER À LA MAIN sur Supabase (SQL Editor). Ne pas rejouer si déjà passée.
-- (Après application : régénérer src/types/database.ts pour typer la colonne `bucket`.)

BEGIN;

-- 1. Mémoriser le bucket réel (NULL = inférence par défaut sur file_url)
ALTER TABLE propulspace.documents
  ADD COLUMN IF NOT EXISTS storage_bucket text NULL;

COMMENT ON COLUMN propulspace.documents.storage_bucket IS
  'Bucket Storage réel. NULL => inféré depuis file_url. Renseigné=project-documents pour les docs CRM rapatriés (SP4).';

-- 2. Recréer la vue admin AVEC bucket = COALESCE(storage_bucket, CASE…)
DROP VIEW IF EXISTS public.propulspace_documents_admin_v2;
CREATE VIEW public.propulspace_documents_admin_v2
  WITH (security_invoker = true) AS
SELECT
  id, project_id, document_type, category, name, description,
  file_url, file_size_bytes, file_mime_type, version,
  visible_to_client, uploaded_by_client, viewed_by_client_at, created_at,
  COALESCE(
    storage_bucket,
    CASE
      WHEN file_url LIKE 'qualification/%' THEN 'propulspace-uploads'
      WHEN file_url LIKE 'http%'           THEN 'external'
      ELSE 'propulspace-documents'
    END
  ) AS bucket
FROM propulspace.documents
WHERE deleted_at IS NULL;

REVOKE ALL ON public.propulspace_documents_admin_v2 FROM anon;
GRANT SELECT ON public.propulspace_documents_admin_v2 TO authenticated;

COMMIT;
