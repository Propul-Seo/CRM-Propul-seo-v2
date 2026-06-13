-- ============================================================
-- Migration 007 : Migrer public.checklist_items_v2 → v2.checklist_items
-- ============================================================

CREATE TABLE v2.checklist_items (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES v2.projects(id) ON DELETE CASCADE,
  parent_task_id  UUID,
  template_id     UUID,  -- FK ajoutée après création de v2.checklist_templates
  phase           TEXT NOT NULL DEFAULT 'general'
                    CHECK (phase IN ('onboarding','conception','developpement','recette','post_livraison','general')),
  title           TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'todo'
                    CHECK (status IN ('todo','in_progress','done','skipped')),
  priority        TEXT NOT NULL DEFAULT 'medium'
                    CHECK (priority IN ('low','medium','high','urgent')),
  assigned_to     UUID REFERENCES public.users(id),
  assigned_name   TEXT,
  due_date        DATE,
  completed_at    TIMESTAMPTZ,
  estimated_hours NUMERIC(5,1),
  actual_hours    NUMERIC(5,1),
  position        INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Copier les données : sort_order → position
INSERT INTO v2.checklist_items (
  id, project_id, parent_task_id, phase, title, description,
  status, priority, assigned_to, assigned_name, due_date,
  position, created_at, updated_at
)
SELECT
  id, project_id, parent_task_id, phase, title, description,
  status, priority, assigned_to, assigned_name, due_date,
  sort_order AS position, created_at, updated_at
FROM public.checklist_items_v2;

-- Index
CREATE INDEX idx_v2_checklist_project ON v2.checklist_items(project_id);
CREATE INDEX idx_v2_checklist_parent  ON v2.checklist_items(parent_task_id) WHERE parent_task_id IS NOT NULL;

-- Trigger updated_at
CREATE TRIGGER trg_v2_checklist_updated
  BEFORE UPDATE ON v2.checklist_items
  FOR EACH ROW EXECUTE FUNCTION v2.set_updated_at();

-- RLS
ALTER TABLE v2.checklist_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated all checklist_items"
  ON v2.checklist_items FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Audit trigger
CREATE TRIGGER audit_v2_checklist
  AFTER INSERT OR UPDATE OR DELETE ON v2.checklist_items
  FOR EACH ROW EXECUTE FUNCTION v2.audit_trigger_func();
