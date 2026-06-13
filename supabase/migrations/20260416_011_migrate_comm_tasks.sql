-- ============================================================
-- Migration 011 : Migrer public.comm_tasks → v2.comm_tasks
-- ============================================================

CREATE TABLE v2.comm_tasks (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES v2.projects(id) ON DELETE CASCADE,
  cycle_id        UUID,  -- FK ajoutée après création de v2.comm_cycles
  title           TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'todo'
                    CHECK (status IN ('todo','in_progress','review','done')),
  priority        TEXT NOT NULL DEFAULT 'moyenne'
                    CHECK (priority IN ('faible','moyenne','haute','critique')),
  assigned_to     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  due_date        DATE,
  due_hour        TIME,
  category        TEXT CHECK (category IS NULL OR category IN ('creation','shooting','montage','redaction','publication')),
  post_id         UUID,  -- FK ajoutée après création de v2.comm_posts
  position        INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Copier les données : due_hour int → time
INSERT INTO v2.comm_tasks (
  id, project_id, title, description, status, priority,
  assigned_to, due_date, due_hour, position, created_at, updated_at
)
SELECT
  id, project_id, title, description, status, priority,
  assigned_to, due_date,
  CASE WHEN due_hour IS NOT NULL THEN make_time(due_hour, 0, 0) ELSE NULL END AS due_hour,
  0 AS position, created_at, updated_at
FROM public.comm_tasks;

-- Index
CREATE INDEX idx_v2_comm_tasks_project  ON v2.comm_tasks(project_id);
CREATE INDEX idx_v2_comm_tasks_due_date ON v2.comm_tasks(due_date);
CREATE INDEX idx_v2_comm_tasks_status   ON v2.comm_tasks(status);

-- Trigger updated_at
CREATE TRIGGER trg_v2_comm_tasks_updated
  BEFORE UPDATE ON v2.comm_tasks
  FOR EACH ROW EXECUTE FUNCTION v2.set_updated_at();

-- RLS
ALTER TABLE v2.comm_tasks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated all comm_tasks"
  ON v2.comm_tasks FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Audit trigger
CREATE TRIGGER audit_v2_comm_tasks
  AFTER INSERT OR UPDATE OR DELETE ON v2.comm_tasks
  FOR EACH ROW EXECUTE FUNCTION v2.audit_trigger_func();
