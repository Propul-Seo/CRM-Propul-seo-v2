-- ============================================================
-- Migration 015 : Créer v2.payment_milestones
-- ============================================================

CREATE TABLE v2.payment_milestones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES v2.projects(id) ON DELETE CASCADE,
  label           TEXT NOT NULL,
  percentage      NUMERIC(5,2) NOT NULL,
  amount          NUMERIC(12,2),
  invoice_id      UUID REFERENCES v2.invoices(id) ON DELETE SET NULL,
  status          TEXT DEFAULT 'pending'
                    CHECK (status IN ('pending','invoiced','paid')),
  trigger_phase   TEXT,
  due_date        DATE,
  position        INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_v2_milestones_project ON v2.payment_milestones(project_id);

CREATE TRIGGER trg_v2_milestones_updated
  BEFORE UPDATE ON v2.payment_milestones
  FOR EACH ROW EXECUTE FUNCTION v2.set_updated_at();

ALTER TABLE v2.payment_milestones ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated all payment_milestones"
  ON v2.payment_milestones FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Audit trigger
CREATE TRIGGER audit_v2_milestones
  AFTER INSERT OR UPDATE OR DELETE ON v2.payment_milestones
  FOR EACH ROW EXECUTE FUNCTION v2.audit_trigger_func();
