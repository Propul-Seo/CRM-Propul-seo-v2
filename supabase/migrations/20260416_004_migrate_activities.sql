-- ============================================================
-- Migration 004 : Migrer public.project_activities_v2 → v2.project_activities
-- ============================================================

CREATE TABLE v2.project_activities (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES v2.projects(id) ON DELETE CASCADE,
  user_id         UUID REFERENCES public.users(id),
  author_name     TEXT,
  type            TEXT NOT NULL DEFAULT 'task'
                    CHECK (type IN ('email','call','meeting','decision','task','file','access','status','invoice','system')),
  title           TEXT NOT NULL,
  description     TEXT,
  is_auto         BOOLEAN NOT NULL DEFAULT false,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Copier les données : mapper content → title (description NULL pour l'existant)
INSERT INTO v2.project_activities (
  id, project_id, user_id, author_name, type, title, description, is_auto, metadata, created_at
)
SELECT
  id, project_id, user_id, author_name, type,
  content AS title,
  NULL AS description,
  is_auto, metadata, created_at
FROM public.project_activities_v2;

-- Index
CREATE INDEX idx_v2_activities_project ON v2.project_activities(project_id);
CREATE INDEX idx_v2_activities_created ON v2.project_activities(created_at DESC);

-- RLS
ALTER TABLE v2.project_activities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated all activities"
  ON v2.project_activities FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
