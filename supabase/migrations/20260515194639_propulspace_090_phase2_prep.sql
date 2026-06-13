-- ⚠️ MIGRATION HISTORIQUE — DÉJÀ APPLIQUÉE EN PROD
-- Versionnée a posteriori le 2026-05-17 pour combler le drift repo/prod.
-- Source : supabase_migrations.schema_migrations (project ERP, tbuqctfgjjxnevmsvucl).
-- Ne PAS rejouer sur la prod existante.
-- Pour env neuf uniquement (clone + supabase db reset).
--
-- ⚠️ RISQUE R-009 (documenté dans .planning/PROGRESS_PROPULSPACE.md) :
-- La colonne portal_client_email ajoutée ici est référencée par RLS
-- (portal_project_id() v2 en migration 140) sans :
--   - INDEX  → risque perf à 10k+ projets
--   - UNIQUE → 2 projets peuvent partager le même email, LIMIT 1 arbitraire
-- À durcir hors Sprint A.1 (backlog perf + intégrité).

-- Phase 2 prep: 3 colonnes manquantes detectees au pre-flight
-- 1) Email du client portail (pour magic link / activation)
ALTER TABLE public.projects_v2 ADD COLUMN portal_client_email TEXT;
COMMENT ON COLUMN public.projects_v2.portal_client_email IS 'Email utilise pour le magic link du portail client (Phase 2 Propul Space)';

-- 2) Flag onboarding wizard premier login
ALTER TABLE public.users ADD COLUMN onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE;
COMMENT ON COLUMN public.users.onboarding_completed IS 'True si le client a termine le wizard onboarding (3 etapes premier login)';

-- 3) Notes internes admin sur un lead qualifie
ALTER TABLE propulspace.qualification_leads ADD COLUMN notes TEXT;
COMMENT ON COLUMN propulspace.qualification_leads.notes IS 'Notes internes admin (non visibles client) - rappel commercial, contexte qualif';
