-- Migration Sprint 2 : Enrichissement SIRET Pappers
-- clés company_data attendues : denomination, siren, forme_juridique, adresse, dirigeants, date_creation
ALTER TABLE public.projects_v2
  ADD COLUMN IF NOT EXISTS siret               VARCHAR(14),
  ADD COLUMN IF NOT EXISTS company_data        JSONB,
  ADD COLUMN IF NOT EXISTS company_enriched_at TIMESTAMPTZ;

-- Index partiel : ne couvre que les lignes ayant un SIRET (la plupart n'en auront pas)
CREATE INDEX IF NOT EXISTS idx_projects_v2_siret ON public.projects_v2(siret) WHERE siret IS NOT NULL;
