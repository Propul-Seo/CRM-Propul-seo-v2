-- ============================================================
-- Migration 013 : Créer les briefs spécialisés
-- ============================================================

-- Brief Site Web
CREATE TABLE v2.briefs_siteweb (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL UNIQUE REFERENCES v2.projects(id) ON DELETE CASCADE,
  pack                TEXT CHECK (pack IS NULL OR pack IN ('starter','professionnel','entreprise','sur_mesure')),
  nb_pages            INTEGER,
  niveau_seo          TEXT CHECK (niveau_seo IS NULL OR niveau_seo IN ('basique','avance','premium')),
  objective           TEXT,
  target_audience     TEXT,
  design_references   TEXT[],
  techno              TEXT,
  has_blog            BOOLEAN DEFAULT false,
  has_ecommerce       BOOLEAN DEFAULT false,
  has_multilingual    BOOLEAN DEFAULT false,
  specific_features   TEXT,
  submitted_at        TIMESTAMPTZ,
  submitted_by        TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER trg_v2_briefs_sw_updated
  BEFORE UPDATE ON v2.briefs_siteweb
  FOR EACH ROW EXECUTE FUNCTION v2.set_updated_at();

ALTER TABLE v2.briefs_siteweb ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated all briefs_siteweb"
  ON v2.briefs_siteweb FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Brief ERP
CREATE TABLE v2.briefs_erp (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL UNIQUE REFERENCES v2.projects(id) ON DELETE CASCADE,
  modules             TEXT[] NOT NULL DEFAULT '{}',
  nb_utilisateurs     INTEGER,
  outils_integres     TEXT[],
  objective           TEXT,
  target_audience     TEXT,
  budget_range        TEXT,
  existing_system     TEXT,
  specific_features   TEXT,
  submitted_at        TIMESTAMPTZ,
  submitted_by        TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER trg_v2_briefs_erp_updated
  BEFORE UPDATE ON v2.briefs_erp
  FOR EACH ROW EXECUTE FUNCTION v2.set_updated_at();

ALTER TABLE v2.briefs_erp ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated all briefs_erp"
  ON v2.briefs_erp FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Brief Communication
CREATE TABLE v2.briefs_comm (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL UNIQUE REFERENCES v2.projects(id) ON DELETE CASCADE,
  type                TEXT CHECK (type IS NULL OR type IN ('abonnement','branding','photos_videos')),
  pack                TEXT CHECK (pack IS NULL OR pack IN ('starter','premium','excellence')),
  platforms           TEXT[],
  objective           TEXT,
  target_audience     TEXT,
  tone_of_voice       TEXT,
  posting_frequency   TEXT,
  has_photo_shooting  BOOLEAN DEFAULT false,
  has_video           BOOLEAN DEFAULT false,
  brand_guidelines    TEXT,
  specific_features   TEXT,
  submitted_at        TIMESTAMPTZ,
  submitted_by        TEXT,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER trg_v2_briefs_comm_updated
  BEFORE UPDATE ON v2.briefs_comm
  FOR EACH ROW EXECUTE FUNCTION v2.set_updated_at();

ALTER TABLE v2.briefs_comm ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated all briefs_comm"
  ON v2.briefs_comm FOR ALL TO authenticated
  USING (true) WITH CHECK (true);
