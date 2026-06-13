-- Bucket Storage pour les documents de projets (V2)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'project-documents',
  'project-documents',
  false,
  52428800,  -- 50 MB
  NULL       -- tous types MIME
)
ON CONFLICT (id) DO NOTHING;

-- Policies : utilisateurs authentifiés peuvent lire/uploader/supprimer
-- (accès contrôlé au niveau table project_documents_v2 via RLS)

CREATE POLICY "Authenticated users can read project documents"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'project-documents');

CREATE POLICY "Authenticated users can upload project documents"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'project-documents');

CREATE POLICY "Authenticated users can delete project documents"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'project-documents');
