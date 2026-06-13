-- ============================================================
-- ProjectsManagerV2 — Tables complètes
-- ============================================================

-- 1. projects_v2
CREATE TABLE IF NOT EXISTS public.projects_v2 (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_id       UUID,
  client_name     TEXT NOT NULL DEFAULT '',
  name            TEXT NOT NULL,
  description     TEXT,
  status          TEXT NOT NULL DEFAULT 'prospect'
                    CHECK (status IN ('prospect','brief_received','quote_sent','in_progress','review','delivered','maintenance','on_hold','closed')),
  priority        TEXT NOT NULL DEFAULT 'medium'
                    CHECK (priority IN ('low','medium','high','urgent')),
  assigned_to     UUID,
  assigned_name   TEXT,
  start_date      DATE,
  end_date        DATE,
  budget          NUMERIC(12,2),
  progress        INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  category        TEXT,
  presta_type     TEXT[] DEFAULT '{}',
  completion_score INTEGER DEFAULT 0 CHECK (completion_score BETWEEN 0 AND 100),
  last_activity_at TIMESTAMPTZ DEFAULT now(),
  completed_at    TIMESTAMPTZ,
  is_archived     BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. checklist_items_v2
CREATE TABLE IF NOT EXISTS public.checklist_items_v2 (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES public.projects_v2(id) ON DELETE CASCADE,
  parent_task_id  UUID,
  title           TEXT NOT NULL,
  description     TEXT,
  phase           TEXT NOT NULL DEFAULT 'general'
                    CHECK (phase IN ('onboarding','conception','developpement','recette','post_livraison','general')),
  status          TEXT NOT NULL DEFAULT 'todo'
                    CHECK (status IN ('todo','in_progress','done')),
  priority        TEXT NOT NULL DEFAULT 'medium'
                    CHECK (priority IN ('low','medium','high','urgent')),
  assigned_to     UUID,
  assigned_name   TEXT,
  due_date        DATE,
  sort_order      INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. project_activities_v2
CREATE TABLE IF NOT EXISTS public.project_activities_v2 (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES public.projects_v2(id) ON DELETE CASCADE,
  user_id         UUID,
  author_name     TEXT,
  type            TEXT NOT NULL DEFAULT 'task'
                    CHECK (type IN ('email','call','decision','task','file','access','status','invoice','system')),
  content         TEXT NOT NULL,
  is_auto         BOOLEAN NOT NULL DEFAULT false,
  metadata        JSONB DEFAULT '{}',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 4. project_accesses_v2
CREATE TABLE IF NOT EXISTS public.project_accesses_v2 (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL REFERENCES public.projects_v2(id) ON DELETE CASCADE,
  category            TEXT NOT NULL DEFAULT 'tools'
                        CHECK (category IN ('hosting','cms','analytics','social','tools','design')),
  service_name        TEXT NOT NULL,
  url                 TEXT,
  login               TEXT,
  password            TEXT,
  notes               TEXT,
  status              TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','missing','broken','expired','pending_validation')),
  detected_from_email BOOLEAN NOT NULL DEFAULT false,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 5. project_documents_v2
CREATE TABLE IF NOT EXISTS public.project_documents_v2 (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES public.projects_v2(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  category        TEXT NOT NULL DEFAULT 'other'
                    CHECK (category IN ('contract','brief','mockup','report','deliverable','invoice','other')),
  version         TEXT,
  file_path       TEXT,
  file_size       INTEGER,
  mime_type       TEXT,
  uploaded_by     UUID,
  uploader_name   TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. project_briefs_v2
CREATE TABLE IF NOT EXISTS public.project_briefs_v2 (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL UNIQUE REFERENCES public.projects_v2(id) ON DELETE CASCADE,
  objective           TEXT,
  target_audience     TEXT,
  pages               TEXT,
  techno              TEXT,
  design_references   TEXT,
  notes               TEXT,
  status              TEXT NOT NULL DEFAULT 'draft'
                        CHECK (status IN ('draft','validated','frozen')),
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 7. project_invoices_v2
CREATE TABLE IF NOT EXISTS public.project_invoices_v2 (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id      UUID NOT NULL REFERENCES public.projects_v2(id) ON DELETE CASCADE,
  label           TEXT NOT NULL,
  amount          NUMERIC(12,2) NOT NULL DEFAULT 0,
  status          TEXT NOT NULL DEFAULT 'draft'
                    CHECK (status IN ('draft','sent','paid','overdue','cancelled')),
  date            DATE,
  due_date        DATE,
  notes           TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. project_follow_ups_v2
CREATE TABLE IF NOT EXISTS public.project_follow_ups_v2 (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id        UUID NOT NULL REFERENCES public.projects_v2(id) ON DELETE CASCADE,
  type              TEXT NOT NULL DEFAULT 'autre'
                      CHECK (type IN ('rdv','appel','email','autre')),
  date              TIMESTAMPTZ NOT NULL DEFAULT now(),
  summary           TEXT NOT NULL,
  follow_up_action  TEXT,
  follow_up_date    DATE,
  follow_up_done    BOOLEAN NOT NULL DEFAULT false,
  assigned_to       UUID,
  assigned_name     TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================================
-- Index
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_projects_v2_status      ON public.projects_v2(status);
CREATE INDEX IF NOT EXISTS idx_projects_v2_assigned    ON public.projects_v2(assigned_to);
CREATE INDEX IF NOT EXISTS idx_projects_v2_archived    ON public.projects_v2(is_archived);
CREATE INDEX IF NOT EXISTS idx_checklist_project       ON public.checklist_items_v2(project_id);
CREATE INDEX IF NOT EXISTS idx_activities_project      ON public.project_activities_v2(project_id);
CREATE INDEX IF NOT EXISTS idx_activities_created      ON public.project_activities_v2(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_accesses_project        ON public.project_accesses_v2(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_project       ON public.project_documents_v2(project_id);
CREATE INDEX IF NOT EXISTS idx_invoices_project        ON public.project_invoices_v2(project_id);
CREATE INDEX IF NOT EXISTS idx_followups_project       ON public.project_follow_ups_v2(project_id);

-- ============================================================
-- updated_at auto-trigger
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_projects_v2_updated_at
  BEFORE UPDATE ON public.projects_v2
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_checklist_v2_updated_at
  BEFORE UPDATE ON public.checklist_items_v2
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_accesses_v2_updated_at
  BEFORE UPDATE ON public.project_accesses_v2
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_briefs_v2_updated_at
  BEFORE UPDATE ON public.project_briefs_v2
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE TRIGGER trg_invoices_v2_updated_at
  BEFORE UPDATE ON public.project_invoices_v2
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- RLS (désactivé pour dev, à activer en prod)
-- ============================================================
ALTER TABLE public.projects_v2          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checklist_items_v2   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_activities_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_accesses_v2  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_documents_v2 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_briefs_v2    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_invoices_v2  ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_follow_ups_v2 ENABLE ROW LEVEL SECURITY;

-- Policies permissives pour dev (accès total authentifié)
CREATE POLICY "dev_all_projects_v2"          ON public.projects_v2          FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_checklist_v2"         ON public.checklist_items_v2   FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_activities_v2"        ON public.project_activities_v2 FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_accesses_v2"          ON public.project_accesses_v2  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_documents_v2"         ON public.project_documents_v2 FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_briefs_v2"            ON public.project_briefs_v2    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_invoices_v2"          ON public.project_invoices_v2  FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "dev_all_followups_v2"         ON public.project_follow_ups_v2 FOR ALL USING (true) WITH CHECK (true);
