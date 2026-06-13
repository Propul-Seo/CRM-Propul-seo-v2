-- ============================================================
-- Migration 006 : Migrer public.project_follow_ups_v2 → v2.follow_ups
-- ============================================================

CREATE TABLE v2.follow_ups (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES v2.projects(id) ON DELETE CASCADE,
  type            TEXT NOT NULL DEFAULT 'autre'
                    CHECK (type IN ('rdv','appel','email','autre')),
  title           TEXT NOT NULL,
  description     TEXT,
  follow_up_date  TIMESTAMPTZ,
  completed_at    TIMESTAMPTZ,
  assigned_to     UUID REFERENCES public.users(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Copier les données : restructurer les colonnes
INSERT INTO v2.follow_ups (
  id, project_id, type, title, description, follow_up_date, completed_at, assigned_to, created_at
)
SELECT
  id, project_id, type,
  COALESCE(follow_up_action, summary, 'Sans titre') AS title,
  summary AS description,
  COALESCE(follow_up_date::timestamptz, date) AS follow_up_date,
  CASE WHEN follow_up_done THEN created_at ELSE NULL END AS completed_at,
  assigned_to,
  created_at
FROM public.project_follow_ups_v2;

-- Index
CREATE INDEX idx_v2_followups_project ON v2.follow_ups(project_id);

-- Trigger updated_at
CREATE TRIGGER trg_v2_followups_updated
  BEFORE UPDATE ON v2.follow_ups
  FOR EACH ROW EXECUTE FUNCTION v2.set_updated_at();

-- RLS
ALTER TABLE v2.follow_ups ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated all follow_ups"
  ON v2.follow_ups FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
