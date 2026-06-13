-- supabase/migrations/20260411_brief_token.sql
-- ============================================================
-- BRIEF TOKEN — Formulaire de brief client
-- ============================================================
-- À appliquer MANUELLEMENT via le Dashboard Supabase → SQL Editor
-- Copier-coller ce fichier dans l'éditeur SQL et exécuter.
-- ============================================================

-- 1. Colonnes brief_token sur projects_v2
ALTER TABLE public.projects_v2
  ADD COLUMN IF NOT EXISTS brief_token         UUID    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS brief_token_enabled BOOLEAN DEFAULT FALSE;

-- 2. Index unique (lookup rapide + contrainte d'unicité)
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_v2_brief_token
  ON public.projects_v2 (brief_token)
  WHERE brief_token IS NOT NULL;

-- 3. Colonne submitted_at sur project_briefs_v2
ALTER TABLE public.project_briefs_v2
  ADD COLUMN IF NOT EXISTS submitted_at TIMESTAMPTZ DEFAULT NULL;

-- 4. DROP POLICY IF EXISTS (sécurité re-exécution)
DROP POLICY IF EXISTS "brief_read_project_name"        ON public.projects_v2;
DROP POLICY IF EXISTS "brief_read_project_briefs_v2"   ON public.project_briefs_v2;
DROP POLICY IF EXISTS "brief_insert_project_briefs_v2" ON public.project_briefs_v2;
DROP POLICY IF EXISTS "brief_update_project_briefs_v2" ON public.project_briefs_v2;

-- 5. RLS — lecture publique (anon) du projet via brief_token
CREATE POLICY "brief_read_project_name"
  ON public.projects_v2
  FOR SELECT
  TO anon
  USING (brief_token IS NOT NULL AND brief_token_enabled = TRUE);

-- 6. RLS — lecture publique du brief via brief_token
CREATE POLICY "brief_read_project_briefs_v2"
  ON public.project_briefs_v2
  FOR SELECT
  TO anon
  USING (
    project_id IN (
      SELECT id FROM public.projects_v2
      WHERE brief_token IS NOT NULL AND brief_token_enabled = TRUE
    )
  );

-- 7. RLS — insertion publique (anon) dans project_briefs_v2 via brief_token
CREATE POLICY "brief_insert_project_briefs_v2"
  ON public.project_briefs_v2
  FOR INSERT
  TO anon
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects_v2
      WHERE brief_token IS NOT NULL AND brief_token_enabled = TRUE
    )
  );

-- 8. RLS — mise à jour publique (anon) dans project_briefs_v2 via brief_token
CREATE POLICY "brief_update_project_briefs_v2"
  ON public.project_briefs_v2
  FOR UPDATE
  TO anon
  USING (
    project_id IN (
      SELECT id FROM public.projects_v2
      WHERE brief_token IS NOT NULL AND brief_token_enabled = TRUE
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects_v2
      WHERE brief_token IS NOT NULL AND brief_token_enabled = TRUE
    )
  );
