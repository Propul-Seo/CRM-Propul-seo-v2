-- ⚠️ MIGRATION HISTORIQUE — DÉJÀ APPLIQUÉE EN PROD
-- Versionnée a posteriori le 2026-05-17 pour combler le drift repo/prod.
-- Source : supabase_migrations.schema_migrations (project ERP, tbuqctfgjjxnevmsvucl).
-- Ne PAS rejouer sur la prod existante.
-- Pour env neuf uniquement (clone + supabase db reset).
--
-- 🟠 RISQUE R-012 (documenté dans .planning/PROGRESS_PROPULSPACE.md) :
-- La vue fait SELECT * et expose TOUTES les colonnes de qualification_leads
-- aux clients REST API (anon + authenticated), y compris :
--   - quality_score, quality_score_breakdown (scoring commercial)
--   - pappers_enrichment, ip_address, user_agent (traces techniques)
--   - notes, ae_assigned, converted_to_project_id (workflow interne)
-- Combinée à R-011 (RLS SELECT anon ouverte sur les drafts), surface d'attaque
-- élargie. À restreindre en Sprint A.3 : SELECT explicite uniquement des
-- colonnes du formulaire client.

GRANT USAGE ON SCHEMA propulspace TO anon, authenticated;
GRANT SELECT, INSERT, UPDATE ON propulspace.qualification_leads TO anon, authenticated;

CREATE OR REPLACE VIEW public.qualification_leads_v2
  WITH (security_invoker = true) AS
  SELECT * FROM propulspace.qualification_leads;

GRANT SELECT, INSERT, UPDATE ON public.qualification_leads_v2 TO anon, authenticated;
