-- ============================================================
-- Migration 012 : Créer v2.checklist_templates
-- ============================================================

CREATE TABLE v2.checklist_templates (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name            TEXT NOT NULL,
  presta_type     TEXT NOT NULL CHECK (presta_type IN ('web','seo','erp','communication')),
  phase           TEXT NOT NULL CHECK (phase IN ('onboarding','conception','developpement','recette','post_livraison','general')),
  title           TEXT NOT NULL,
  description     TEXT,
  priority        TEXT DEFAULT 'medium' CHECK (priority IN ('low','medium','high','urgent')),
  estimated_hours NUMERIC(5,1),
  position        INTEGER DEFAULT 0,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  created_by      UUID REFERENCES public.users(id)
);

CREATE INDEX idx_v2_templates_presta ON v2.checklist_templates(presta_type);
CREATE INDEX idx_v2_templates_phase  ON v2.checklist_templates(phase);

ALTER TABLE v2.checklist_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated all checklist_templates"
  ON v2.checklist_templates FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Ajouter la FK template_id sur checklist_items
ALTER TABLE v2.checklist_items
  ADD CONSTRAINT fk_checklist_template
  FOREIGN KEY (template_id) REFERENCES v2.checklist_templates(id) ON DELETE SET NULL;
