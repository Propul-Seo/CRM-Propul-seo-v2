-- =====================================================
-- MIGRATION: NETTOYAGE DONNÉES COMPTABILITÉ
-- Supprime toutes les données d'exemple et initialise un état vide
-- =====================================================

-- Supprimer toutes les données d'exemple
DELETE FROM accounting_entries WHERE month_key IN ('2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06', '2025-07');

-- Supprimer toutes les métriques d'exemple
DELETE FROM monthly_accounting_metrics WHERE month IN ('2025-01', '2025-02', '2025-03', '2025-04', '2025-05', '2025-06', '2025-07');

-- Créer UNIQUEMENT les métriques pour Mai 2025 avec des valeurs vides
INSERT INTO monthly_accounting_metrics (month, month_label, total_revenue, total_expenses, net_result, revenue_count, expense_count, is_current_month) VALUES
('2025-05', 'Mai 2025', 0.00, 0.00, 0.00, 0, 0, false)
ON CONFLICT (month) DO UPDATE SET
  total_revenue = 0.00,
  total_expenses = 0.00,
  net_result = 0.00,
  revenue_count = 0,
  expense_count = 0,
  is_current_month = false,
  updated_at = NOW();

-- Vérifier que les tables sont propres
-- Les requêtes suivantes doivent retourner 0 pour les données d'exemple
SELECT 'Nettoyage terminé - Vérification:' as status;
SELECT COUNT(*) as total_entries FROM accounting_entries;
SELECT COUNT(*) as total_metrics FROM monthly_accounting_metrics;
SELECT month, month_label, total_revenue, total_expenses, net_result FROM monthly_accounting_metrics WHERE month = '2025-05'; 