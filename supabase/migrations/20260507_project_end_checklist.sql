-- Checklist "Fin de projet" par projet
-- La procédure 'cloturer-projet' est la source canonique des items.
-- Cette table stocke l'état (coché + commentaire) de chaque item PAR projet.
-- item_key = hash stable du texte de l'item (8 premiers chars du SHA-256 côté client).

CREATE TABLE IF NOT EXISTS public.project_end_checklist_state (
  project_id   UUID NOT NULL REFERENCES public.projects_v2(id) ON DELETE CASCADE,
  item_key     TEXT NOT NULL,
  checked      BOOLEAN NOT NULL DEFAULT false,
  comment      TEXT,
  checked_by   UUID REFERENCES public.users(id) ON DELETE SET NULL,
  checked_at   TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (project_id, item_key)
);

CREATE INDEX IF NOT EXISTS idx_pecs_project ON public.project_end_checklist_state(project_id);

-- Trigger updated_at
CREATE OR REPLACE FUNCTION public.tg_pecs_set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pecs_set_updated_at ON public.project_end_checklist_state;
CREATE TRIGGER pecs_set_updated_at
  BEFORE UPDATE ON public.project_end_checklist_state
  FOR EACH ROW EXECUTE FUNCTION public.tg_pecs_set_updated_at();

-- RLS : tout user authentifié référencé dans public.users peut lire/écrire
ALTER TABLE public.project_end_checklist_state ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Read project end checklist" ON public.project_end_checklist_state;
CREATE POLICY "Read project end checklist"
  ON public.project_end_checklist_state FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid())
  );

DROP POLICY IF EXISTS "Write project end checklist" ON public.project_end_checklist_state;
CREATE POLICY "Write project end checklist"
  ON public.project_end_checklist_state FOR ALL TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth.uid())
  );

COMMENT ON TABLE public.project_end_checklist_state IS
  'État (coché + commentaire) des items de la checklist Fin de projet, par projet. La procédure "cloturer-projet" reste la source canonique des items ; cette table ne stocke que l''état dérivé.';
