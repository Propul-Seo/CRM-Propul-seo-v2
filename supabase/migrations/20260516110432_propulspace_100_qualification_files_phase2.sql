-- ⚠️ MIGRATION HISTORIQUE — DÉJÀ APPLIQUÉE EN PROD
-- Versionnée a posteriori le 2026-05-17 pour combler le drift repo/prod.
-- Source : supabase_migrations.schema_migrations (project ERP, tbuqctfgjjxnevmsvucl).
-- Ne PAS rejouer sur la prod existante.
-- Pour env neuf uniquement (clone + supabase db reset).
--
-- ⚠️ RISQUE R-010 (documenté dans .planning/PROGRESS_PROPULSPACE.md) :
-- Les 3 colonnes ajoutées ici dupliquent l'info de propulspace.qualification_uploads
-- (mêmes types : logo/charter/site_screenshot). Pas de trigger de sync.
-- Risque désynchronisation. À consolider en backlog.

ALTER TABLE propulspace.qualification_leads
  ADD COLUMN IF NOT EXISTS existing_site_screenshots jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS logo_file_url             text,
  ADD COLUMN IF NOT EXISTS brand_guide_url           text;

COMMENT ON COLUMN propulspace.qualification_leads.existing_site_screenshots IS
  'Array de paths Storage (propulspace-uploads/qualification/<id>/screenshot-*.{png,jpg}). Max 3 fichiers, 25MB chacun. Validé côté front.';
COMMENT ON COLUMN propulspace.qualification_leads.logo_file_url IS
  'Path Storage du logo (PNG/SVG/JPG/AI). Rempli si brand_status IN (charte_complete, juste_logo).';
COMMENT ON COLUMN propulspace.qualification_leads.brand_guide_url IS
  'Path Storage de la charte graphique PDF. Rempli si brand_status = charte_complete.';
