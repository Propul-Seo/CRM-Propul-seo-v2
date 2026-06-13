-- supabase/migrations/20260406_add_portal_token.sql

-- 1. Colonnes
ALTER TABLE public.projects_v2
  ADD COLUMN IF NOT EXISTS portal_token  UUID    DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS portal_enabled BOOLEAN DEFAULT FALSE;

-- 2. Index unique (lookup rapide + contrainte d'unicité)
CREATE UNIQUE INDEX IF NOT EXISTS idx_projects_v2_portal_token
  ON public.projects_v2 (portal_token)
  WHERE portal_token IS NOT NULL;

-- 3. Politique RLS pour lecture publique (anon) via portal_token
--    Fonctionne en dev (les policies "dev_all_*" coexistent)
--    et sera la seule policy valide en prod quand les "dev_all_*" seront retirées.
CREATE POLICY "portal_read_projects_v2"
  ON public.projects_v2
  FOR SELECT
  TO anon
  USING (portal_token IS NOT NULL AND portal_enabled = TRUE);

CREATE POLICY "portal_read_checklist_v2"
  ON public.checklist_items_v2
  FOR SELECT
  TO anon
  USING (
    project_id IN (
      SELECT id FROM public.projects_v2
      WHERE portal_token IS NOT NULL AND portal_enabled = TRUE
    )
  );

CREATE POLICY "portal_read_invoices_v2"
  ON public.project_invoices_v2
  FOR SELECT
  TO anon
  USING (
    project_id IN (
      SELECT id FROM public.projects_v2
      WHERE portal_token IS NOT NULL AND portal_enabled = TRUE
    )
  );
