-- ============================================================
-- Migration 008 : Migrer public.project_briefs_v2 → v2.project_briefs
-- ============================================================

CREATE TABLE v2.project_briefs (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL UNIQUE REFERENCES v2.projects(id) ON DELETE CASCADE,
  objective           TEXT,
  target_audience     TEXT,
  pages               TEXT,
  techno              TEXT,
  design_references   TEXT,
  notes               TEXT,
  status              TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','submitted','validated','frozen')),
  submitted_at        TIMESTAMPTZ,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Copier les données
INSERT INTO v2.project_briefs (
  id, project_id, objective, target_audience, pages, techno,
  design_references, notes, status, submitted_at, created_at, updated_at
)
SELECT
  id, project_id, objective, target_audience, pages, techno,
  design_references, notes, status, submitted_at, created_at, updated_at
FROM public.project_briefs_v2;

-- Index
CREATE INDEX idx_v2_briefs_project ON v2.project_briefs(project_id);

-- Trigger updated_at
CREATE TRIGGER trg_v2_briefs_updated
  BEFORE UPDATE ON v2.project_briefs
  FOR EACH ROW EXECUTE FUNCTION v2.set_updated_at();

-- RLS
ALTER TABLE v2.project_briefs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated all project_briefs"
  ON v2.project_briefs FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
