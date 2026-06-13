/*
  # Vues comptables pour dashboard

  1. Nouvelles vues
    - `monthly_revenue` - Revenus mensuels agrégés
    - `monthly_expenses` - Dépenses mensuelles agrégées
    - `monthly_net_result` - Résultat net mensuel (revenus - dépenses)
  
  2. Fonctionnalités
    - Agrégation par mois
    - Calcul automatique des totaux
    - Jointure pour le résultat net
*/

-- Vue des revenus mensuels
CREATE OR REPLACE VIEW monthly_revenue AS
SELECT
  date_trunc('month', entry_date) AS month,
  SUM(amount) AS total_revenue
FROM accounting_entries
WHERE type = 'revenue'
GROUP BY month
ORDER BY month;

-- Vue des dépenses mensuelles
CREATE OR REPLACE VIEW monthly_expenses AS
SELECT
  date_trunc('month', entry_date) AS month,
  SUM(amount) AS total_expenses
FROM accounting_entries
WHERE type = 'expense'
GROUP BY month
ORDER BY month;

-- Vue du résultat net mensuel
CREATE OR REPLACE VIEW monthly_net_result AS
SELECT
  r.month,
  r.total_revenue - COALESCE(e.total_expenses, 0) AS net_result
FROM monthly_revenue r
LEFT JOIN monthly_expenses e
ON r.month = e.month
ORDER BY r.month;