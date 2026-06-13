-- ============================================================
-- Migration 014 : Créer v2.comm_cycles et v2.comm_posts
-- ============================================================

-- Cycles mensuels
CREATE TABLE v2.comm_cycles (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES v2.projects(id) ON DELETE CASCADE,
  month           INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
  year            INTEGER NOT NULL,
  status          TEXT DEFAULT 'planning'
                    CHECK (status IN ('planning','in_progress','review','completed')),
  objectives      TEXT,
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(project_id, month, year)
);

CREATE INDEX idx_v2_cycles_project ON v2.comm_cycles(project_id);

CREATE TRIGGER trg_v2_cycles_updated
  BEFORE UPDATE ON v2.comm_cycles
  FOR EACH ROW EXECUTE FUNCTION v2.set_updated_at();

ALTER TABLE v2.comm_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated all comm_cycles"
  ON v2.comm_cycles FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Posts réseaux sociaux
CREATE TABLE v2.comm_posts (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES v2.projects(id) ON DELETE CASCADE,
  cycle_id        UUID REFERENCES v2.comm_cycles(id) ON DELETE SET NULL,
  platform        TEXT NOT NULL CHECK (platform IN ('instagram','linkedin','facebook','tiktok')),
  post_type       TEXT CHECK (post_type IS NULL OR post_type IN ('image','carousel','reel','story','article')),
  caption         TEXT,
  hashtags        TEXT[],
  media_urls      TEXT[],
  scheduled_at    TIMESTAMPTZ,
  published_at    TIMESTAMPTZ,
  status          TEXT DEFAULT 'draft'
                    CHECK (status IN ('draft','ready','scheduled','published')),
  notes           TEXT,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_v2_posts_project ON v2.comm_posts(project_id);
CREATE INDEX idx_v2_posts_cycle   ON v2.comm_posts(cycle_id) WHERE cycle_id IS NOT NULL;
CREATE INDEX idx_v2_posts_status  ON v2.comm_posts(status);

CREATE TRIGGER trg_v2_posts_updated
  BEFORE UPDATE ON v2.comm_posts
  FOR EACH ROW EXECUTE FUNCTION v2.set_updated_at();

ALTER TABLE v2.comm_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated all comm_posts"
  ON v2.comm_posts FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Audit trigger sur les posts
CREATE TRIGGER audit_v2_comm_posts
  AFTER INSERT OR UPDATE OR DELETE ON v2.comm_posts
  FOR EACH ROW EXECUTE FUNCTION v2.audit_trigger_func();

-- Ajouter les FK sur comm_tasks maintenant que les tables existent
ALTER TABLE v2.comm_tasks
  ADD CONSTRAINT fk_comm_task_cycle
  FOREIGN KEY (cycle_id) REFERENCES v2.comm_cycles(id) ON DELETE SET NULL;

ALTER TABLE v2.comm_tasks
  ADD CONSTRAINT fk_comm_task_post
  FOREIGN KEY (post_id) REFERENCES v2.comm_posts(id) ON DELETE SET NULL;
