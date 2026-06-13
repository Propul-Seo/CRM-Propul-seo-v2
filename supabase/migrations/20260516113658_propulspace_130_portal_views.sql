-- ⚠️ MIGRATION HISTORIQUE — DÉJÀ APPLIQUÉE EN PROD
-- Versionnée a posteriori le 2026-05-17 pour combler le drift repo/prod.
-- Source : supabase_migrations.schema_migrations (project ERP, tbuqctfgjjxnevmsvucl).
-- Ne PAS rejouer sur la prod existante.
-- Pour env neuf uniquement (clone + supabase db reset).
--
-- 🔴 RISQUE R-013 (documenté dans .planning/PROGRESS_PROPULSPACE.md) :
-- GRANT INSERT/UPDATE accordés à 'anon' sur les tables portail (invoices,
-- documents, signatures, etc.). Les RLS de 070 bloquent en pratique, mais
-- défense en profondeur compromise (un seul filet de sécurité).
-- À durcir Sprint A.3 : retirer anon des GRANTs sur tables portail,
-- limiter authenticated aux droits minimaux nécessaires.
--
-- 🟠 RISQUE R-012 (suite) : les 5 vues font SELECT *, exposant des colonnes
-- internes (internal_notes, stripe_payment_intent_id, created_by, signer_ip,
-- decline_reason, etc.) aux clients authentifiés. À restreindre par SELECT
-- explicite des colonnes nécessaires côté client.

GRANT SELECT, INSERT, UPDATE ON propulspace.invoices TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON propulspace.invoice_installments TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON propulspace.documents TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON propulspace.signatures TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON propulspace.project_steps TO anon, authenticated;

CREATE OR REPLACE VIEW public.propulspace_invoices_v2
  WITH (security_invoker = true) AS SELECT * FROM propulspace.invoices;
CREATE OR REPLACE VIEW public.propulspace_invoice_installments_v2
  WITH (security_invoker = true) AS SELECT * FROM propulspace.invoice_installments;
CREATE OR REPLACE VIEW public.propulspace_documents_v2
  WITH (security_invoker = true) AS SELECT * FROM propulspace.documents;
CREATE OR REPLACE VIEW public.propulspace_signatures_v2
  WITH (security_invoker = true) AS SELECT * FROM propulspace.signatures;
CREATE OR REPLACE VIEW public.propulspace_project_steps_v2
  WITH (security_invoker = true) AS SELECT * FROM propulspace.project_steps;

GRANT SELECT, INSERT, UPDATE ON public.propulspace_invoices_v2 TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.propulspace_invoice_installments_v2 TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.propulspace_documents_v2 TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.propulspace_signatures_v2 TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON public.propulspace_project_steps_v2 TO anon, authenticated;
