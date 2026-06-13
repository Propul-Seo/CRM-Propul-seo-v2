-- supabase/migrations/20260412_short_codes.sql
-- Ajout des short codes 8 chars pour les URLs publiques (next-public)

-- 1. brief_invitations : short_code (uuid token reste valide en fallback)
ALTER TABLE public.brief_invitations
  ADD COLUMN IF NOT EXISTS short_code TEXT UNIQUE;

CREATE INDEX IF NOT EXISTS idx_brief_invitations_short_code
  ON public.brief_invitations (short_code)
  WHERE short_code IS NOT NULL;

-- 2. projects_v2 : brief_short_code + portal_short_code + portal_expires_at
ALTER TABLE public.projects_v2
  ADD COLUMN IF NOT EXISTS brief_short_code  TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS portal_short_code TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS portal_expires_at TIMESTAMPTZ DEFAULT NULL;

CREATE INDEX IF NOT EXISTS idx_projects_v2_brief_short_code
  ON public.projects_v2 (brief_short_code)
  WHERE brief_short_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_projects_v2_portal_short_code
  ON public.projects_v2 (portal_short_code)
  WHERE portal_short_code IS NOT NULL;

-- 3. RLS : anon lit brief_invitations via short_code
DROP POLICY IF EXISTS "anon_read_by_short_code" ON public.brief_invitations;
CREATE POLICY "anon_read_by_short_code" ON public.brief_invitations
  FOR SELECT TO anon
  USING (short_code IS NOT NULL AND status IN ('pending', 'submitted'));

-- 4. RLS : anon lit projects_v2 via brief_short_code
DROP POLICY IF EXISTS "brief_read_by_short_code" ON public.projects_v2;
CREATE POLICY "brief_read_by_short_code" ON public.projects_v2
  FOR SELECT TO anon
  USING (brief_short_code IS NOT NULL AND brief_token_enabled = TRUE);

-- 5. RLS : anon lit projects_v2 via portal_short_code (avec expiration)
DROP POLICY IF EXISTS "portal_read_by_short_code" ON public.projects_v2;
CREATE POLICY "portal_read_by_short_code" ON public.projects_v2
  FOR SELECT TO anon
  USING (
    portal_short_code IS NOT NULL
    AND portal_enabled = TRUE
    AND (portal_expires_at IS NULL OR portal_expires_at > now())
  );

-- 6. RLS : anon lit checklist_items_v2 via portal_short_code
DROP POLICY IF EXISTS "portal_read_checklist_by_short_code" ON public.checklist_items_v2;
CREATE POLICY "portal_read_checklist_by_short_code" ON public.checklist_items_v2
  FOR SELECT TO anon
  USING (
    project_id IN (
      SELECT id FROM public.projects_v2
      WHERE portal_short_code IS NOT NULL
        AND portal_enabled = TRUE
        AND (portal_expires_at IS NULL OR portal_expires_at > now())
    )
  );

-- 7. RLS : anon lit project_invoices_v2 via portal_short_code
DROP POLICY IF EXISTS "portal_read_invoices_by_short_code" ON public.project_invoices_v2;
CREATE POLICY "portal_read_invoices_by_short_code" ON public.project_invoices_v2
  FOR SELECT TO anon
  USING (
    project_id IN (
      SELECT id FROM public.projects_v2
      WHERE portal_short_code IS NOT NULL
        AND portal_enabled = TRUE
        AND (portal_expires_at IS NULL OR portal_expires_at > now())
    )
  );

-- 8. RLS : anon lit project_briefs_v2 via brief_short_code
DROP POLICY IF EXISTS "brief_read_briefs_by_short_code" ON public.project_briefs_v2;
CREATE POLICY "brief_read_briefs_by_short_code" ON public.project_briefs_v2
  FOR SELECT TO anon
  USING (
    project_id IN (
      SELECT id FROM public.projects_v2
      WHERE brief_short_code IS NOT NULL AND brief_token_enabled = TRUE
    )
  );

-- 9. RLS : anon insère dans project_briefs_v2 via brief_short_code
DROP POLICY IF EXISTS "brief_insert_briefs_by_short_code" ON public.project_briefs_v2;
CREATE POLICY "brief_insert_briefs_by_short_code" ON public.project_briefs_v2
  FOR INSERT TO anon
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects_v2
      WHERE brief_short_code IS NOT NULL AND brief_token_enabled = TRUE
    )
  );

-- 10. RLS : anon met à jour project_briefs_v2 via brief_short_code
DROP POLICY IF EXISTS "brief_update_briefs_by_short_code" ON public.project_briefs_v2;
CREATE POLICY "brief_update_briefs_by_short_code" ON public.project_briefs_v2
  FOR UPDATE TO anon
  USING (
    project_id IN (
      SELECT id FROM public.projects_v2
      WHERE brief_short_code IS NOT NULL AND brief_token_enabled = TRUE
    )
  )
  WITH CHECK (
    project_id IN (
      SELECT id FROM public.projects_v2
      WHERE brief_short_code IS NOT NULL AND brief_token_enabled = TRUE
    )
  );
