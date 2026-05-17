-- ⚠️ MIGRATION HISTORIQUE — DÉJÀ APPLIQUÉE EN PROD
-- Versionnée a posteriori le 2026-05-17 pour combler le drift repo/prod.
-- Source : supabase_migrations.schema_migrations (project ERP, tbuqctfgjjxnevmsvucl).
-- Ne PAS rejouer sur la prod existante.
-- Pour env neuf uniquement (clone + supabase db reset).

-- ============================================================================
-- Migration 010 — Propul'Space schema initialization
-- 100% additive, reversible via DROP SCHEMA propulspace CASCADE
-- ============================================================================

CREATE SCHEMA IF NOT EXISTS propulspace;
COMMENT ON SCHEMA propulspace IS
  'Premium client portal — qualification leads, invoices, signatures, documents, onboarding. Isolated from CRM core (public, v2).';

GRANT USAGE ON SCHEMA propulspace TO authenticated, anon, service_role;
GRANT ALL ON ALL TABLES    IN SCHEMA propulspace TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA propulspace TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA propulspace GRANT ALL ON TABLES    TO service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA propulspace GRANT ALL ON SEQUENCES TO service_role;

CREATE SEQUENCE IF NOT EXISTS propulspace.invoice_number_seq
  AS BIGINT START WITH 1031 INCREMENT BY 1 MINVALUE 1031 NO MAXVALUE CACHE 1;
COMMENT ON SEQUENCE propulspace.invoice_number_seq IS
  'Atomic invoice counter. Starts at 1031 (continues from existing #1030). Never reset — French anti-fraud law forbids gaps.';

CREATE OR REPLACE FUNCTION propulspace.next_invoice_number()
RETURNS TEXT
LANGUAGE SQL
SECURITY DEFINER
SET search_path = propulspace, pg_temp
AS $$
  SELECT 'PS-' || nextval('propulspace.invoice_number_seq')::TEXT;
$$;
COMMENT ON FUNCTION propulspace.next_invoice_number() IS
  'Returns next invoice number in format PS-XXXX. Atomic via sequence nextval.';
GRANT EXECUTE ON FUNCTION propulspace.next_invoice_number() TO service_role;
