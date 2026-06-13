-- ============================================================
-- Migration 003 : Migrer public.projects_v2 → v2.projects
-- ============================================================

-- 1. Créer la table v2.projects avec toutes les colonnes existantes + nouvelles
CREATE TABLE v2.projects (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_id             UUID,
  client_name           TEXT NOT NULL DEFAULT '',
  name                  TEXT NOT NULL,
  description           TEXT,
  status                TEXT NOT NULL DEFAULT 'prospect'
                          CHECK (status IN ('prospect','brief_received','quote_sent','in_progress','review','delivered','maintenance','on_hold','closed')),
  priority              TEXT NOT NULL DEFAULT 'medium'
                          CHECK (priority IN ('low','medium','high','urgent')),
  assigned_to           UUID,
  assigned_name         TEXT,
  presta_type           TEXT[] NOT NULL DEFAULT '{}',
  -- Statuts pipeline par module
  sw_status             TEXT,
  erp_status            TEXT,
  comm_status           TEXT CHECK (comm_status IS NULL OR comm_status IN ('prospect','brief_creatif','devis_envoye','signe','en_production','actif','termine','perdu')),
  -- Dates et budget
  start_date            DATE,
  end_date              DATE,
  budget                NUMERIC(12,2),
  progress              INTEGER DEFAULT 0 CHECK (progress BETWEEN 0 AND 100),
  category              TEXT,
  completion_score      INTEGER DEFAULT 0 CHECK (completion_score BETWEEN 0 AND 100),
  last_activity_at      TIMESTAMPTZ DEFAULT now(),
  completed_at          TIMESTAMPTZ,
  is_archived           BOOLEAN NOT NULL DEFAULT false,
  -- Next action
  next_action_label     TEXT,
  next_action_due       DATE,
  -- SIRET / Company data
  siret                 VARCHAR(14),
  company_data          JSONB,
  company_enriched_at   TIMESTAMPTZ,
  -- AI Summary
  ai_summary            JSONB,
  ai_summary_generated_at TIMESTAMPTZ,
  -- Portal client
  portal_token          UUID UNIQUE,
  portal_enabled        BOOLEAN DEFAULT false,
  portal_short_code     TEXT UNIQUE,
  portal_expires_at     TIMESTAMPTZ,
  -- Brief token
  brief_token           UUID UNIQUE,
  brief_token_enabled   BOOLEAN DEFAULT false,
  brief_short_code      TEXT UNIQUE,
  -- Nouvelle colonne spec
  created_by            UUID REFERENCES public.users(id),
  -- Colonne positionnement kanban
  position              INTEGER DEFAULT 0,
  -- Timestamps
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2. Copier les données existantes
INSERT INTO v2.projects (
  id, user_id, client_id, client_name, name, description,
  status, priority, assigned_to, assigned_name,
  presta_type, comm_status,
  start_date, end_date, budget, progress, category,
  completion_score, last_activity_at, completed_at, is_archived,
  next_action_label, next_action_due,
  siret, company_data, company_enriched_at,
  ai_summary, ai_summary_generated_at,
  portal_token, portal_enabled, portal_short_code, portal_expires_at,
  brief_token, brief_token_enabled, brief_short_code,
  created_at, updated_at
)
SELECT
  id, user_id, client_id, client_name, name, description,
  status, priority, assigned_to, assigned_name,
  presta_type, comm_status,
  start_date, end_date, budget, progress, category,
  completion_score, last_activity_at, completed_at, is_archived,
  next_action_label, next_action_due,
  siret, company_data, company_enriched_at,
  ai_summary, ai_summary_generated_at,
  portal_token, portal_enabled, portal_short_code, portal_expires_at,
  brief_token, brief_token_enabled, brief_short_code,
  created_at, updated_at
FROM public.projects_v2;

-- 3. Index
CREATE INDEX idx_v2_projects_status    ON v2.projects(status);
CREATE INDEX idx_v2_projects_assigned  ON v2.projects(assigned_to);
CREATE INDEX idx_v2_projects_archived  ON v2.projects(is_archived);
CREATE INDEX idx_v2_projects_comm      ON v2.projects(comm_status) WHERE comm_status IS NOT NULL;
CREATE INDEX idx_v2_projects_siret     ON v2.projects(siret) WHERE siret IS NOT NULL;
CREATE INDEX idx_v2_projects_portal    ON v2.projects(portal_short_code) WHERE portal_short_code IS NOT NULL;
CREATE INDEX idx_v2_projects_brief     ON v2.projects(brief_short_code) WHERE brief_short_code IS NOT NULL;

-- 4. Trigger updated_at
CREATE TRIGGER trg_v2_projects_updated
  BEFORE UPDATE ON v2.projects
  FOR EACH ROW EXECUTE FUNCTION v2.set_updated_at();

-- 5. RLS
ALTER TABLE v2.projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated all projects"
  ON v2.projects FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- 6. Audit trigger
CREATE TRIGGER audit_v2_projects
  AFTER INSERT OR UPDATE OR DELETE ON v2.projects
  FOR EACH ROW EXECUTE FUNCTION v2.audit_trigger_func();

-- 7. Vue backward-compat (permet au code non migré de continuer à fonctionner)
-- On drop l'ancienne table public.projects_v2 et on la remplace par une vue
-- ATTENTION : on ne peut pas drop si d'autres tables ont des FK dessus
-- On crée la vue sous un nom temporaire d'abord, puis on swap après migration des enfants
-- Pour l'instant, on garde les deux (la vue sera créée après migration de toutes les tables enfants)
