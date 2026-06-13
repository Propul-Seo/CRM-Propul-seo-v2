-- Migration : ajouter erp_status à projects_v2
-- Même pattern que 20260414_add_comm_status.sql
ALTER TABLE public.projects_v2
  ADD COLUMN IF NOT EXISTS erp_status TEXT;

CREATE INDEX IF NOT EXISTS idx_projects_v2_erp_status
  ON public.projects_v2(erp_status)
  WHERE erp_status IS NOT NULL;
