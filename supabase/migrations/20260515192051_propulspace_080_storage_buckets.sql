-- ⚠️ MIGRATION HISTORIQUE — DÉJÀ APPLIQUÉE EN PROD
-- Versionnée a posteriori le 2026-05-17 pour combler le drift repo/prod.
-- Source : supabase_migrations.schema_migrations (project ERP, tbuqctfgjjxnevmsvucl).
-- Ne PAS rejouer sur la prod existante.
-- Pour env neuf uniquement (clone + supabase db reset).
--
-- ⚠️ RISQUE R-008 (documenté dans .planning/PROGRESS_PROPULSPACE.md) :
-- la policy "ps_docs_storage_client_read" autorise tout client portail
-- authentifié à lire n'importe quel objet du bucket propulspace-documents
-- (vérifie seulement portal_project_id() IS NOT NULL, pas l'appartenance
-- du fichier au projet). Fuite cross-tenant théorique mitigée en pratique
-- par les UUID imprévisibles + signed URLs. À durcir en Sprint A.3.

-- ============================================================================
-- Migration 080 — Storage buckets + RLS policies for Propul'Space files
-- - propulspace-uploads : Phase 0 public form attachments (signed URLs)
-- - propulspace-documents : Portal docs/invoices/contracts (signed URLs)
-- ============================================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'propulspace-uploads',
  'propulspace-uploads',
  false,
  26214400,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'propulspace-documents',
  'propulspace-documents',
  false,
  52428800,
  ARRAY[
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'image/jpeg', 'image/png', 'image/webp', 'image/svg+xml',
    'text/plain', 'text/csv'
  ]::text[]
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "ps_uploads_public_insert" ON storage.objects
  FOR INSERT TO anon, authenticated
  WITH CHECK (bucket_id = 'propulspace-uploads');

CREATE POLICY "ps_uploads_admin_select" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'propulspace-uploads' AND propulspace.is_admin());

CREATE POLICY "ps_uploads_admin_delete" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'propulspace-uploads' AND propulspace.is_admin());

CREATE POLICY "ps_docs_storage_admin_all" ON storage.objects
  FOR ALL TO authenticated
  USING (bucket_id = 'propulspace-documents' AND propulspace.is_admin())
  WITH CHECK (bucket_id = 'propulspace-documents' AND propulspace.is_admin());

CREATE POLICY "ps_docs_storage_client_read" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'propulspace-documents'
    AND propulspace.portal_project_id() IS NOT NULL
  );
