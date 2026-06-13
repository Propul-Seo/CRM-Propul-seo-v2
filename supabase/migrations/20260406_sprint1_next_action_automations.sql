-- Migration Sprint 1 : Prochaine action + Automation logs
-- Feature 2 — champs "prochaine action" sur projects_v2
ALTER TABLE projects_v2 ADD COLUMN IF NOT EXISTS next_action_label TEXT;
ALTER TABLE projects_v2 ADD COLUMN IF NOT EXISTS next_action_due DATE;

-- Feature 5 — table d'audit des automatisations
CREATE TABLE IF NOT EXISTS automation_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES projects_v2(id) ON DELETE CASCADE,
  trigger_type VARCHAR(50) NOT NULL,
  from_value TEXT,
  to_value TEXT,
  actions_executed JSONB,
  executed_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index pour requêtes par projet
CREATE INDEX IF NOT EXISTS automation_logs_project_id_idx ON automation_logs(project_id);
