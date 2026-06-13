-- Migration pour les tables de synchronisation budget projet
-- Date: 2025-01-18

-- =====================================================
-- TABLE: revenue_entries - Entrées de revenus
-- =====================================================

CREATE TABLE IF NOT EXISTS revenue_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  amount DECIMAL(12,2) NOT NULL,
  revenue_date TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('project_budget', 'project_signed', 'project_milestone', 'project_completed', 'recurring', 'other')),
  client_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  client_name TEXT,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('services', 'products', 'maintenance', 'consulting', 'other')),
  status TEXT NOT NULL CHECK (status IN ('projected', 'received', 'pending')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: budget_sync_logs - Logs de synchronisation budget
-- =====================================================

CREATE TABLE IF NOT EXISTS budget_sync_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
  project_name TEXT NOT NULL,
  old_budget DECIMAL(12,2) DEFAULT 0,
  new_budget DECIMAL(12,2) NOT NULL,
  sync_status TEXT NOT NULL CHECK (sync_status IN ('pending', 'completed', 'failed')),
  revenue_entry_id UUID REFERENCES revenue_entries(id) ON DELETE SET NULL,
  accounting_entry_id UUID REFERENCES accounting_entries(id) ON DELETE SET NULL,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES pour optimiser les requêtes
-- =====================================================

-- Index pour revenue_entries
CREATE INDEX IF NOT EXISTS idx_revenue_entries_user_id ON revenue_entries(user_id);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_project_id ON revenue_entries(project_id);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_type ON revenue_entries(type);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_status ON revenue_entries(status);
CREATE INDEX IF NOT EXISTS idx_revenue_entries_revenue_date ON revenue_entries(revenue_date);

-- Index pour budget_sync_logs
CREATE INDEX IF NOT EXISTS idx_budget_sync_logs_user_id ON budget_sync_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_budget_sync_logs_project_id ON budget_sync_logs(project_id);
CREATE INDEX IF NOT EXISTS idx_budget_sync_logs_sync_status ON budget_sync_logs(sync_status);
CREATE INDEX IF NOT EXISTS idx_budget_sync_logs_created_at ON budget_sync_logs(created_at);

-- =====================================================
-- POLICIES RLS (Row Level Security)
-- =====================================================

-- Activer RLS sur revenue_entries
ALTER TABLE revenue_entries ENABLE ROW LEVEL SECURITY;

-- Policy pour revenue_entries
CREATE POLICY "Users can manage their own revenue entries"
ON revenue_entries
FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- Activer RLS sur budget_sync_logs
ALTER TABLE budget_sync_logs ENABLE ROW LEVEL SECURITY;

-- Policy pour budget_sync_logs
CREATE POLICY "Users can manage their own budget sync logs"
ON budget_sync_logs
FOR ALL
TO authenticated
USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS pour mettre à jour updated_at
-- =====================================================

-- Trigger pour revenue_entries
CREATE TRIGGER update_revenue_entries_updated_at
BEFORE UPDATE ON revenue_entries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour calculer le total des revenus par projet
CREATE OR REPLACE FUNCTION get_project_revenue_total(project_uuid UUID)
RETURNS DECIMAL(12,2) AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(amount) 
     FROM revenue_entries 
     WHERE project_id = project_uuid), 
    0
  );
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir le statut de synchronisation d'un projet
CREATE OR REPLACE FUNCTION get_project_sync_status(project_uuid UUID)
RETURNS TEXT AS $$
BEGIN
  RETURN (
    SELECT sync_status 
    FROM budget_sync_logs 
    WHERE project_id = project_uuid 
    ORDER BY created_at DESC 
    LIMIT 1
  );
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- VUES pour faciliter les requêtes
-- =====================================================

-- Vue pour les projets avec leurs revenus
CREATE OR REPLACE VIEW project_revenue_summary AS
SELECT 
  p.id as project_id,
  p.name as project_name,
  p.budget as project_budget,
  p.client_id,
  c.nom as client_name,
  COALESCE(SUM(r.amount), 0) as total_revenue,
  COUNT(r.id) as revenue_entries_count,
  get_project_sync_status(p.id) as last_sync_status
FROM projects p
LEFT JOIN revenue_entries r ON p.id = r.project_id
LEFT JOIN contacts c ON p.client_id = c.id
WHERE p.user_id = auth.uid()
GROUP BY p.id, p.name, p.budget, p.client_id, c.nom;

-- Vue pour les logs de synchronisation récents
CREATE OR REPLACE VIEW recent_budget_syncs AS
SELECT 
  bsl.id,
  bsl.project_id,
  bsl.project_name,
  bsl.old_budget,
  bsl.new_budget,
  bsl.sync_status,
  bsl.created_at,
  p.name as current_project_name,
  c.nom as client_name
FROM budget_sync_logs bsl
LEFT JOIN projects p ON bsl.project_id = p.id
LEFT JOIN contacts c ON p.client_id = c.id
WHERE bsl.user_id = auth.uid()
ORDER BY bsl.created_at DESC;

-- =====================================================
-- COMMENTAIRES pour la documentation
-- =====================================================

COMMENT ON TABLE revenue_entries IS 'Entrées de revenus liées aux projets et autres sources de revenus';
COMMENT ON TABLE budget_sync_logs IS 'Logs de synchronisation automatique des budgets projet avec la comptabilité';
COMMENT ON VIEW project_revenue_summary IS 'Vue consolidée des projets avec leurs revenus totaux';
COMMENT ON VIEW recent_budget_syncs IS 'Vue des synchronisations de budget récentes';

COMMENT ON COLUMN revenue_entries.type IS 'Type de revenu: project_budget, project_signed, project_milestone, etc.';
COMMENT ON COLUMN revenue_entries.status IS 'Statut du revenu: projected (prévu), received (reçu), pending (en attente)';
COMMENT ON COLUMN budget_sync_logs.sync_status IS 'Statut de la synchronisation: pending, completed, failed'; 