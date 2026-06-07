-- propulspace 289 — SP4 : backfill project_documents_v2 -> propulspace.documents.
--
-- Rapatrie les docs CRM legacy (encore dans public.project_documents_v2) vers la
-- table canonique. Idempotent (ON CONFLICT (id) DO NOTHING) : rejouable sans risque.
-- Décisions :
--   - category CRM -> document_type portail : mapping INVERSE du CASE de la vue 254
--     (mockup -> asset_logo arbitraire ; category reste la valeur CRM d'origine).
--   - uploader_name -> description (pas de colonne dédiée côté canonique).
--   - version (text legacy) -> int : on garde uniquement les chiffres ; NULL si non num.
--   - storage_bucket = 'project-documents' : les fichiers physiques restent dans
--     l'ancien bucket (conservé en lecture ; pas de déplacement physique en SP4).
--   - visible_to_client = false : les docs CRM legacy sont internes par défaut.
-- ⚠️ À APPLIQUER À LA MAIN sur Supabase (SQL Editor), APRÈS la mig. 288.

INSERT INTO propulspace.documents (
  id, project_id, document_type, category, name, description,
  file_url, file_size_bytes, file_mime_type, version,
  visible_to_client, uploaded_by_client, uploaded_by, storage_bucket, created_at
)
SELECT
  d.id, d.project_id,
  CASE d.category   -- mapping inverse du CASE de la vue 254
    WHEN 'contract' THEN 'contract' WHEN 'invoice' THEN 'invoice'
    WHEN 'report' THEN 'report' WHEN 'deliverable' THEN 'deliverable'
    WHEN 'mockup' THEN 'asset_logo' ELSE 'other'
  END,
  d.category, d.name, d.uploader_name,           -- uploader_name -> description (pas de col dédiée)
  d.file_path, d.file_size, d.mime_type,
  NULLIF(regexp_replace(coalesce(d.version,''), '\D', '', 'g'), '')::int,  -- version text -> int (NULL si non num.)
  false,                                          -- docs CRM legacy = internes
  false,
  d.uploaded_by,
  'project-documents',                            -- fichiers physiques restés dans l'ancien bucket
  d.created_at
FROM public.project_documents_v2 d
ON CONFLICT (id) DO NOTHING;

-- Vérif (lecture seule, à exécuter après application) : doit renvoyer 0.
--   SELECT count(*) FROM public.project_documents_v2 v
--   WHERE NOT EXISTS (SELECT 1 FROM propulspace.documents d WHERE d.id = v.id);
