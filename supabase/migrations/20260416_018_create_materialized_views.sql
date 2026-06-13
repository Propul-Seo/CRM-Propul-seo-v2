-- ============================================================
-- Migration 018 : Créer les vues matérialisées KPI
-- ============================================================

-- Vue globale KPI
CREATE MATERIALIZED VIEW v2.kpi_overview AS
SELECT
  COALESCE(SUM(budget) FILTER (WHERE status IN ('in_progress','delivered','maintenance')), 0) AS total_ca,
  COALESCE(SUM(budget) FILTER (WHERE 'communication' = ANY(presta_type) AND comm_status = 'en_production'), 0) AS mrr_comm,
  COALESCE(SUM(budget) FILTER (WHERE 'web' = ANY(presta_type) OR 'seo' = ANY(presta_type) OR 'site_web' = ANY(presta_type)), 0) AS ca_siteweb,
  COALESCE(SUM(budget) FILTER (WHERE 'erp' = ANY(presta_type) OR 'erp_v2' = ANY(presta_type)), 0) AS ca_erp,
  COUNT(*) FILTER (WHERE status = 'in_progress') AS projects_active,
  COUNT(*) FILTER (WHERE status = 'delivered' AND updated_at >= date_trunc('month', now())) AS projects_delivered,
  (SELECT COUNT(*) FROM v2.invoices WHERE status = 'sent') AS invoices_pending,
  (SELECT COUNT(*) FROM v2.invoices WHERE status = 'overdue') AS invoices_overdue,
  COALESCE(AVG(completion_score), 0)::integer AS completion_avg,
  now() AS refreshed_at
FROM v2.projects
WHERE is_archived = false;

-- Index unique pour REFRESH CONCURRENTLY
CREATE UNIQUE INDEX idx_v2_kpi_overview_unique ON v2.kpi_overview(refreshed_at);

-- Vue mensuelle KPI
CREATE MATERIALIZED VIEW v2.kpi_monthly AS
SELECT
  EXTRACT(MONTH FROM created_at)::integer AS month,
  EXTRACT(YEAR FROM created_at)::integer AS year,
  COALESCE(SUM(budget) FILTER (WHERE 'web' = ANY(presta_type) OR 'seo' = ANY(presta_type) OR 'site_web' = ANY(presta_type)), 0) AS ca_siteweb,
  COALESCE(SUM(budget) FILTER (WHERE 'erp' = ANY(presta_type) OR 'erp_v2' = ANY(presta_type)), 0) AS ca_erp,
  COALESCE(SUM(budget) FILTER (WHERE 'communication' = ANY(presta_type)), 0) AS ca_comm,
  COUNT(*) AS new_projects,
  COUNT(*) FILTER (WHERE status = 'delivered') AS delivered_projects,
  now() AS refreshed_at
FROM v2.projects
WHERE is_archived = false
GROUP BY month, year
ORDER BY year DESC, month DESC;

-- Index unique pour REFRESH CONCURRENTLY
CREATE UNIQUE INDEX idx_v2_kpi_monthly_unique ON v2.kpi_monthly(month, year);

-- Note : pg_cron doit être activé manuellement sur le projet Supabase
-- Puis exécuter :
-- SELECT cron.schedule('refresh-kpi-overview', '*/15 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY v2.kpi_overview');
-- SELECT cron.schedule('refresh-kpi-monthly', '*/15 * * * *', 'REFRESH MATERIALIZED VIEW CONCURRENTLY v2.kpi_monthly');
