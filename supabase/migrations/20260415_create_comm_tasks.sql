-- ============================================================
-- Table comm_tasks : tâches du module Communication
-- Rattachée à projects_v2 (category = 'communication')
-- ============================================================

CREATE TABLE IF NOT EXISTS public.comm_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects_v2(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  status text NOT NULL DEFAULT 'todo'
    CHECK (status IN ('todo','in_progress','done')),
  priority text NOT NULL DEFAULT 'moyenne'
    CHECK (priority IN ('faible','moyenne','haute','critique')),
  due_date date,
  due_hour smallint CHECK (due_hour BETWEEN 0 AND 23),
  assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comm_tasks_project   ON public.comm_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_comm_tasks_due_date  ON public.comm_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_comm_tasks_assigned  ON public.comm_tasks(assigned_to);
CREATE INDEX IF NOT EXISTS idx_comm_tasks_status    ON public.comm_tasks(status);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.comm_tasks_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_comm_tasks_updated_at ON public.comm_tasks;
CREATE TRIGGER trg_comm_tasks_updated_at
  BEFORE UPDATE ON public.comm_tasks
  FOR EACH ROW EXECUTE FUNCTION public.comm_tasks_set_updated_at();

-- RLS
ALTER TABLE public.comm_tasks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS comm_tasks_select ON public.comm_tasks;
CREATE POLICY comm_tasks_select ON public.comm_tasks
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS comm_tasks_insert ON public.comm_tasks;
CREATE POLICY comm_tasks_insert ON public.comm_tasks
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS comm_tasks_update ON public.comm_tasks;
CREATE POLICY comm_tasks_update ON public.comm_tasks
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS comm_tasks_delete ON public.comm_tasks;
CREATE POLICY comm_tasks_delete ON public.comm_tasks
  FOR DELETE TO authenticated USING (true);
