-- Migration Sprint 3 : Résumé IA automatique
-- Structure ai_summary : { situation: string, action: string, milestone: string }
ALTER TABLE public.projects_v2
  ADD COLUMN IF NOT EXISTS ai_summary            JSONB,
  ADD COLUMN IF NOT EXISTS ai_summary_generated_at TIMESTAMPTZ;
