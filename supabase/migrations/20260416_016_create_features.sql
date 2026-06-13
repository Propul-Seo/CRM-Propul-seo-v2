-- ============================================================
-- Migration 016 : Créer v2.feature_templates et v2.project_features
-- ============================================================

CREATE TABLE v2.feature_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  description     TEXT,
  category        TEXT NOT NULL CHECK (category IN ('site_web','erp')),
  subcategory     TEXT,
  code_snippet    TEXT,
  repo_url        TEXT,
  tech_stack      TEXT[],
  estimated_hours NUMERIC(5,1),
  price           NUMERIC(10,2),
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID REFERENCES public.users(id)
);

CREATE INDEX idx_v2_feat_templates_cat ON v2.feature_templates(category);

CREATE TRIGGER trg_v2_feat_templates_updated
  BEFORE UPDATE ON v2.feature_templates
  FOR EACH ROW EXECUTE FUNCTION v2.set_updated_at();

ALTER TABLE v2.feature_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated all feature_templates"
  ON v2.feature_templates FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Project features (pivot table)
CREATE TABLE v2.project_features (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES v2.projects(id) ON DELETE CASCADE,
  template_id     UUID NOT NULL REFERENCES v2.feature_templates(id),
  status          TEXT DEFAULT 'planned'
                    CHECK (status IN ('planned','in_progress','done','cancelled')),
  custom_price    NUMERIC(10,2),
  custom_hours    NUMERIC(5,1),
  notes           TEXT,
  completed_at    TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_v2_proj_features_project ON v2.project_features(project_id);

CREATE TRIGGER trg_v2_proj_features_updated
  BEFORE UPDATE ON v2.project_features
  FOR EACH ROW EXECUTE FUNCTION v2.set_updated_at();

ALTER TABLE v2.project_features ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated all project_features"
  ON v2.project_features FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
