-- =====================================================
-- MIGRATION: COMPTABILITÉ MENSUELLE
-- =====================================================

-- Table pour les métriques mensuelles
CREATE TABLE IF NOT EXISTS monthly_accounting_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  month VARCHAR(7) NOT NULL UNIQUE, -- Format: '2025-01'
  month_label VARCHAR(20) NOT NULL, -- Format: 'Janvier 2025'
  total_revenue DECIMAL(12,2) DEFAULT 0,
  total_expenses DECIMAL(12,2) DEFAULT 0,
  net_result DECIMAL(12,2) DEFAULT 0,
  revenue_count INTEGER DEFAULT 0,
  expense_count INTEGER DEFAULT 0,
  is_current_month BOOLEAN DEFAULT FALSE,
  is_closed BOOLEAN DEFAULT FALSE,
  closed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table pour les entrées comptables avec référence mensuelle
CREATE TABLE IF NOT EXISTS accounting_entries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  type VARCHAR(10) NOT NULL CHECK (type IN ('revenue', 'expense')),
  amount DECIMAL(12,2) NOT NULL,
  description TEXT NOT NULL,
  category VARCHAR(50),
  entry_date DATE NOT NULL,
  month_key VARCHAR(7) NOT NULL, -- Format: '2025-01' pour faciliter les requêtes
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_accounting_entries_month ON accounting_entries(month_key);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_date ON accounting_entries(entry_date);
CREATE INDEX IF NOT EXISTS idx_accounting_entries_type ON accounting_entries(type);
CREATE INDEX IF NOT EXISTS idx_monthly_metrics_month ON monthly_accounting_metrics(month);

-- Fonction pour mettre à jour les métriques mensuelles
CREATE OR REPLACE FUNCTION update_monthly_metrics()
RETURNS TRIGGER AS $$
DECLARE
  month_key VARCHAR(7);
  month_label VARCHAR(20);
BEGIN
  -- Déterminer la clé du mois
  month_key := to_char(NEW.entry_date, 'YYYY-MM');
  month_label := to_char(NEW.entry_date, 'Month YYYY');
  
  -- Insérer ou mettre à jour les métriques mensuelles
  INSERT INTO monthly_accounting_metrics (
    month, 
    month_label, 
    total_revenue, 
    total_expenses, 
    net_result,
    revenue_count,
    expense_count,
    is_current_month
  )
  VALUES (
    month_key,
    month_label,
    CASE WHEN NEW.type = 'revenue' THEN NEW.amount ELSE 0 END,
    CASE WHEN NEW.type = 'expense' THEN NEW.amount ELSE 0 END,
    CASE WHEN NEW.type = 'revenue' THEN NEW.amount ELSE -NEW.amount END,
    CASE WHEN NEW.type = 'revenue' THEN 1 ELSE 0 END,
    CASE WHEN NEW.type = 'expense' THEN 1 ELSE 0 END,
    month_key = to_char(CURRENT_DATE, 'YYYY-MM')
  )
  ON CONFLICT (month) DO UPDATE SET
    total_revenue = monthly_accounting_metrics.total_revenue + 
      CASE WHEN NEW.type = 'revenue' THEN NEW.amount ELSE 0 END,
    total_expenses = monthly_accounting_metrics.total_expenses + 
      CASE WHEN NEW.type = 'expense' THEN NEW.amount ELSE 0 END,
    net_result = monthly_accounting_metrics.net_result + 
      CASE WHEN NEW.type = 'revenue' THEN NEW.amount ELSE -NEW.amount END,
    revenue_count = monthly_accounting_metrics.revenue_count + 
      CASE WHEN NEW.type = 'revenue' THEN 1 ELSE 0 END,
    expense_count = monthly_accounting_metrics.expense_count + 
      CASE WHEN NEW.type = 'expense' THEN 1 ELSE 0 END,
    updated_at = NOW();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement les métriques
CREATE TRIGGER trigger_update_monthly_metrics
  AFTER INSERT ON accounting_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_metrics();

-- Fonction pour supprimer les métriques lors de la suppression d'une entrée
CREATE OR REPLACE FUNCTION delete_monthly_metrics()
RETURNS TRIGGER AS $$
DECLARE
  month_key VARCHAR(7);
BEGIN
  month_key := to_char(OLD.entry_date, 'YYYY-MM');
  
  -- Mettre à jour les métriques mensuelles
  UPDATE monthly_accounting_metrics SET
    total_revenue = total_revenue - 
      CASE WHEN OLD.type = 'revenue' THEN OLD.amount ELSE 0 END,
    total_expenses = total_expenses - 
      CASE WHEN OLD.type = 'expense' THEN OLD.amount ELSE 0 END,
    net_result = net_result - 
      CASE WHEN OLD.type = 'revenue' THEN OLD.amount ELSE -OLD.amount END,
    revenue_count = revenue_count - 
      CASE WHEN OLD.type = 'revenue' THEN 1 ELSE 0 END,
    expense_count = expense_count - 
      CASE WHEN OLD.type = 'expense' THEN 1 ELSE 0 END,
    updated_at = NOW()
  WHERE month = month_key;
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour supprimer les métriques
CREATE TRIGGER trigger_delete_monthly_metrics
  AFTER DELETE ON accounting_entries
  FOR EACH ROW
  EXECUTE FUNCTION delete_monthly_metrics();

-- Fonction pour mettre à jour les métriques lors de la modification
CREATE OR REPLACE FUNCTION update_monthly_metrics_on_update()
RETURNS TRIGGER AS $$
DECLARE
  old_month_key VARCHAR(7);
  new_month_key VARCHAR(7);
BEGIN
  old_month_key := to_char(OLD.entry_date, 'YYYY-MM');
  new_month_key := to_char(NEW.entry_date, 'YYYY-MM');
  
  -- Si le mois a changé, mettre à jour les deux mois
  IF old_month_key != new_month_key THEN
    -- Supprimer de l'ancien mois
    UPDATE monthly_accounting_metrics SET
      total_revenue = total_revenue - 
        CASE WHEN OLD.type = 'revenue' THEN OLD.amount ELSE 0 END,
      total_expenses = total_expenses - 
        CASE WHEN OLD.type = 'expense' THEN OLD.amount ELSE 0 END,
      net_result = net_result - 
        CASE WHEN OLD.type = 'revenue' THEN OLD.amount ELSE -OLD.amount END,
      revenue_count = revenue_count - 
        CASE WHEN OLD.type = 'revenue' THEN 1 ELSE 0 END,
      expense_count = expense_count - 
        CASE WHEN OLD.type = 'expense' THEN 1 ELSE 0 END,
      updated_at = NOW()
    WHERE month = old_month_key;
    
    -- Ajouter au nouveau mois
    INSERT INTO monthly_accounting_metrics (
      month, 
      month_label, 
      total_revenue, 
      total_expenses, 
      net_result,
      revenue_count,
      expense_count,
      is_current_month
    )
    VALUES (
      new_month_key,
      to_char(NEW.entry_date, 'Month YYYY'),
      CASE WHEN NEW.type = 'revenue' THEN NEW.amount ELSE 0 END,
      CASE WHEN NEW.type = 'expense' THEN NEW.amount ELSE 0 END,
      CASE WHEN NEW.type = 'revenue' THEN NEW.amount ELSE -NEW.amount END,
      CASE WHEN NEW.type = 'revenue' THEN 1 ELSE 0 END,
      CASE WHEN NEW.type = 'expense' THEN 1 ELSE 0 END,
      new_month_key = to_char(CURRENT_DATE, 'YYYY-MM')
    )
    ON CONFLICT (month) DO UPDATE SET
      total_revenue = monthly_accounting_metrics.total_revenue + 
        CASE WHEN NEW.type = 'revenue' THEN NEW.amount ELSE 0 END,
      total_expenses = monthly_accounting_metrics.total_expenses + 
        CASE WHEN NEW.type = 'expense' THEN NEW.amount ELSE 0 END,
      net_result = monthly_accounting_metrics.net_result + 
        CASE WHEN NEW.type = 'revenue' THEN NEW.amount ELSE -NEW.amount END,
      revenue_count = monthly_accounting_metrics.revenue_count + 
        CASE WHEN NEW.type = 'revenue' THEN 1 ELSE 0 END,
      expense_count = monthly_accounting_metrics.expense_count + 
        CASE WHEN NEW.type = 'expense' THEN 1 ELSE 0 END,
      updated_at = NOW();
  ELSE
    -- Même mois, mettre à jour les différences
    UPDATE monthly_accounting_metrics SET
      total_revenue = total_revenue + 
        CASE WHEN NEW.type = 'revenue' THEN NEW.amount ELSE 0 END - 
        CASE WHEN OLD.type = 'revenue' THEN OLD.amount ELSE 0 END,
      total_expenses = total_expenses + 
        CASE WHEN NEW.type = 'expense' THEN NEW.amount ELSE 0 END - 
        CASE WHEN OLD.type = 'expense' THEN OLD.amount ELSE 0 END,
      net_result = net_result + 
        CASE WHEN NEW.type = 'revenue' THEN NEW.amount ELSE -NEW.amount END - 
        CASE WHEN OLD.type = 'revenue' THEN OLD.amount ELSE -OLD.amount END,
      updated_at = NOW()
    WHERE month = new_month_key;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour les métriques lors de la modification
CREATE TRIGGER trigger_update_monthly_metrics_on_update
  AFTER UPDATE ON accounting_entries
  FOR EACH ROW
  EXECUTE FUNCTION update_monthly_metrics_on_update();

-- Désactiver RLS pour le développement
ALTER TABLE monthly_accounting_metrics DISABLE ROW LEVEL SECURITY;
ALTER TABLE accounting_entries DISABLE ROW LEVEL SECURITY;

-- Données de test
INSERT INTO monthly_accounting_metrics (month, month_label, total_revenue, total_expenses, net_result, revenue_count, expense_count, is_current_month) VALUES
('2025-01', 'Janvier 2025', 15000.00, 8000.00, 7000.00, 5, 3, false),
('2025-02', 'Février 2025', 18000.00, 9000.00, 9000.00, 6, 4, false),
('2025-03', 'Mars 2025', 22000.00, 11000.00, 11000.00, 7, 5, false),
('2025-04', 'Avril 2025', 19000.00, 9500.00, 9500.00, 6, 4, false),
('2025-05', 'Mai 2025', 25000.00, 12000.00, 13000.00, 8, 5, false),
('2025-06', 'Juin 2025', 28000.00, 13500.00, 14500.00, 9, 6, false),
('2025-07', 'Juillet 2025', 32000.00, 15000.00, 17000.00, 10, 7, true);

-- Entrées de test pour juillet 2025
INSERT INTO accounting_entries (type, amount, description, category, entry_date, month_key) VALUES
('revenue', 5000.00, 'Projet Web E-commerce', 'services', '2025-07-15', '2025-07'),
('revenue', 3500.00, 'Consultation SEO', 'services', '2025-07-20', '2025-07'),
('revenue', 4200.00, 'Maintenance Site', 'maintenance', '2025-07-25', '2025-07'),
('expense', 1200.00, 'Licences Logiciels', 'equipment', '2025-07-10', '2025-07'),
('expense', 800.00, 'Formation Marketing', 'training', '2025-07-18', '2025-07'),
('expense', 1500.00, 'Publicité Google Ads', 'marketing', '2025-07-22', '2025-07'); 