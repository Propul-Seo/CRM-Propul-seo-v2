-- ============================================================
-- Migration 005 : Migrer public.project_documents_v2 → v2.project_documents
-- ============================================================

CREATE TABLE v2.project_documents (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES v2.projects(id) ON DELETE CASCADE,
  category        TEXT NOT NULL DEFAULT 'other'
                    CHECK (category IN ('contract','brief','mockup','report','deliverable','invoice','other')),
  name            TEXT NOT NULL,
  file_url        TEXT NOT NULL DEFAULT '',
  file_size       INTEGER,
  mime_type       TEXT,
  version         INTEGER DEFAULT 1,
  uploaded_by     UUID REFERENCES public.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Copier les données : file_path → file_url, version text → integer
INSERT INTO v2.project_documents (
  id, project_id, category, name, file_url, file_size, mime_type, version, uploaded_by, created_at
)
SELECT
  id, project_id, category, name,
  COALESCE(file_path, '') AS file_url,
  file_size, mime_type,
  CASE WHEN version ~ '^\d+$' THEN version::integer ELSE 1 END AS version,
  uploaded_by, created_at
FROM public.project_documents_v2;

-- Index
CREATE INDEX idx_v2_documents_project ON v2.project_documents(project_id);

-- Trigger updated_at
CREATE TRIGGER trg_v2_documents_updated
  BEFORE UPDATE ON v2.project_documents
  FOR EACH ROW EXECUTE FUNCTION v2.set_updated_at();

-- RLS
ALTER TABLE v2.project_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated all documents"
  ON v2.project_documents FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
