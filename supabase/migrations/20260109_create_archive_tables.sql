-- =====================================================
-- Migration: Create Archive Tables for Annual Reset
-- Date: 2026-01-09
-- Purpose: Support archiving data for year-end reset
-- =====================================================

-- Archive des transactions comptables
CREATE TABLE IF NOT EXISTS archived_accounting_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  original_id UUID,
  entry_date DATE,
  description TEXT,
  amount DECIMAL(10,2),
  type VARCHAR(20),
  category VARCHAR(100),
  month_key VARCHAR(7),
  client_id UUID,
  created_by UUID,
  archived_at TIMESTAMPTZ DEFAULT NOW(),
  original_data JSONB -- Backup complet des donnees originales
);

CREATE INDEX IF NOT EXISTS idx_archived_accounting_entries_year
  ON archived_accounting_entries(year);
CREATE INDEX IF NOT EXISTS idx_archived_accounting_entries_user_id
  ON archived_accounting_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_archived_accounting_entries_original_id
  ON archived_accounting_entries(original_id);

-- Archive des projets termines
CREATE TABLE IF NOT EXISTS archived_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  original_id UUID,
  name VARCHAR(255),
  client_id UUID,
  client_name VARCHAR(255),
  status VARCHAR(50),
  start_date DATE,
  end_date DATE,
  budget DECIMAL(10,2),
  total_amount DECIMAL(10,2),
  assigned_to UUID,
  archived_at TIMESTAMPTZ DEFAULT NOW(),
  original_data JSONB
);

CREATE INDEX IF NOT EXISTS idx_archived_projects_year
  ON archived_projects(year);
CREATE INDEX IF NOT EXISTS idx_archived_projects_user_id
  ON archived_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_archived_projects_original_id
  ON archived_projects(original_id);

-- Archive des taches terminees
CREATE TABLE IF NOT EXISTS archived_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  year INTEGER NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  original_id UUID,
  title VARCHAR(255),
  project_id UUID,
  client_id UUID,
  status VARCHAR(50),
  assigned_to UUID,
  completed_at DATE,
  archived_at TIMESTAMPTZ DEFAULT NOW(),
  original_data JSONB
);

CREATE INDEX IF NOT EXISTS idx_archived_tasks_year
  ON archived_tasks(year);
CREATE INDEX IF NOT EXISTS idx_archived_tasks_user_id
  ON archived_tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_archived_tasks_original_id
  ON archived_tasks(original_id);

-- Statistiques annuelles consolidees
CREATE TABLE IF NOT EXISTS yearly_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  year INTEGER NOT NULL,
  total_income DECIMAL(12,2) DEFAULT 0,
  total_expenses DECIMAL(12,2) DEFAULT 0,
  net_profit DECIMAL(12,2) DEFAULT 0,
  projects_completed INTEGER DEFAULT 0,
  tasks_completed INTEGER DEFAULT 0,
  new_clients INTEGER DEFAULT 0,
  stats_data JSONB, -- Details supplementaires
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, year) -- Une seule entree par utilisateur et par annee
);

CREATE INDEX IF NOT EXISTS idx_yearly_stats_year
  ON yearly_stats(year);
CREATE INDEX IF NOT EXISTS idx_yearly_stats_user_id
  ON yearly_stats(user_id);

-- Trigger pour updated_at sur yearly_stats
CREATE OR REPLACE FUNCTION update_yearly_stats_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_yearly_stats_updated_at ON yearly_stats;
CREATE TRIGGER trigger_yearly_stats_updated_at
  BEFORE UPDATE ON yearly_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_yearly_stats_updated_at();

-- Activer RLS sur les tables d'archive
ALTER TABLE archived_accounting_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE yearly_stats ENABLE ROW LEVEL SECURITY;

-- Policies RLS pour restreindre l'acces aux donnees de l'utilisateur
CREATE POLICY "Users can view own archived_accounting_entries"
  ON archived_accounting_entries FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own archived_accounting_entries"
  ON archived_accounting_entries FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own archived_accounting_entries"
  ON archived_accounting_entries FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own archived_accounting_entries"
  ON archived_accounting_entries FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view own archived_projects"
  ON archived_projects FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own archived_projects"
  ON archived_projects FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own archived_tasks"
  ON archived_tasks FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own archived_tasks"
  ON archived_tasks FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can manage own yearly_stats"
  ON yearly_stats FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- COMMENTAIRES
-- =====================================================
COMMENT ON TABLE archived_accounting_entries IS 'Archive des entrees comptables par annee';
COMMENT ON TABLE archived_projects IS 'Archive des projets termines par annee';
COMMENT ON TABLE archived_tasks IS 'Archive des taches terminees par annee';
COMMENT ON TABLE yearly_stats IS 'Statistiques consolidees par annee';
