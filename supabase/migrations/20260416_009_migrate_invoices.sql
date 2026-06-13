-- ============================================================
-- Migration 009 : Migrer public.project_invoices_v2 → v2.invoices
-- ============================================================

CREATE TABLE v2.invoices (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES v2.projects(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  invoice_number  TEXT UNIQUE,
  amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  tax_rate        NUMERIC(5,2) DEFAULT 20,
  amount_ttc      NUMERIC(12,2) GENERATED ALWAYS AS (amount * (1 + tax_rate / 100)) STORED,
  status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  due_date        DATE,
  paid_at         TIMESTAMPTZ,
  paid_amount     NUMERIC(12,2),
  payment_method  TEXT,
  notes           TEXT,
  pdf_url         TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Copier les données : label → title, date non mappée (pas de colonne date dans la spec)
INSERT INTO v2.invoices (
  id, project_id, title, amount, status, due_date, notes, created_at, updated_at
)
SELECT
  id, project_id, label AS title, amount, status, due_date, notes, created_at, updated_at
FROM public.project_invoices_v2;

-- Index
CREATE INDEX idx_v2_invoices_project ON v2.invoices(project_id);
CREATE INDEX idx_v2_invoices_status  ON v2.invoices(status);

-- Trigger updated_at
CREATE TRIGGER trg_v2_invoices_updated
  BEFORE UPDATE ON v2.invoices
  FOR EACH ROW EXECUTE FUNCTION v2.set_updated_at();

-- RLS
ALTER TABLE v2.invoices ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated all invoices"
  ON v2.invoices FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Audit trigger
CREATE TRIGGER audit_v2_invoices
  AFTER INSERT OR UPDATE OR DELETE ON v2.invoices
  FOR EACH ROW EXECUTE FUNCTION v2.audit_trigger_func();
