-- ⚠️ MIGRATION HISTORIQUE — DÉJÀ APPLIQUÉE EN PROD
-- Versionnée a posteriori le 2026-05-17 pour combler le drift repo/prod.
-- Source : supabase_migrations.schema_migrations (project ERP, tbuqctfgjjxnevmsvucl).
-- Ne PAS rejouer sur la prod existante.
-- Pour env neuf uniquement (clone + supabase db reset).

-- ============================================================================
-- Migration 030 — Audit log + generic trigger function
-- Created FIRST so subsequent tables can attach the trigger upon creation.
-- WARNING: NEVER attach the trigger to audit_log itself (infinite loop).
-- ============================================================================

CREATE TABLE IF NOT EXISTS propulspace.audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID REFERENCES public.projects_v2(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  resource_type TEXT NOT NULL,
  resource_id UUID,
  action TEXT NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
  diff JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE propulspace.audit_log IS
  'Audit log for all sensitive Propul''Space actions (RGPD compliance). Write-only via trigger. Read-only via admin RLS.';

CREATE INDEX IF NOT EXISTS idx_audit_log_resource
  ON propulspace.audit_log(resource_type, resource_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_project
  ON propulspace.audit_log(project_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_log_user
  ON propulspace.audit_log(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION propulspace.audit_trigger_fn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = propulspace, public, pg_temp
AS $fn$
DECLARE
  v_user_id UUID;
  v_project_id UUID;
  v_row JSONB;
  v_resource_id UUID;
BEGIN
  BEGIN
    SELECT id INTO v_user_id
    FROM public.users
    WHERE auth_user_id = auth.uid()
    LIMIT 1;
  EXCEPTION WHEN OTHERS THEN
    v_user_id := NULL;
  END;

  IF TG_OP = 'DELETE' THEN
    v_row := row_to_json(OLD)::JSONB;
  ELSE
    v_row := row_to_json(NEW)::JSONB;
  END IF;

  BEGIN
    v_project_id := (v_row->>'project_id')::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_project_id := NULL;
  END;

  BEGIN
    v_resource_id := (v_row->>'id')::UUID;
  EXCEPTION WHEN OTHERS THEN
    v_resource_id := NULL;
  END;

  INSERT INTO propulspace.audit_log (
    project_id, user_id, resource_type, resource_id, action, diff
  ) VALUES (
    v_project_id,
    v_user_id,
    TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME,
    v_resource_id,
    LOWER(TG_OP),
    CASE
      WHEN TG_OP = 'DELETE' THEN jsonb_build_object('before', row_to_json(OLD))
      WHEN TG_OP = 'UPDATE' THEN jsonb_build_object('before', row_to_json(OLD), 'after', row_to_json(NEW))
      WHEN TG_OP = 'INSERT' THEN jsonb_build_object('after', row_to_json(NEW))
    END
  );

  RETURN COALESCE(NEW, OLD);
END;
$fn$;

COMMENT ON FUNCTION propulspace.audit_trigger_fn() IS
  'Generic audit trigger. Attach to sensitive Propul''Space tables. NEVER attach to audit_log itself.';

GRANT EXECUTE ON FUNCTION propulspace.audit_trigger_fn() TO service_role;
