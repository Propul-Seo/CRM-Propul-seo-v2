-- =====================================================================
-- Migration : table de liaison project_contacts (multi-contacts par projet)
-- Sprint 1.7 V3 — refonte UX page projet
--
-- Permet de lier N contacts à un projet avec un rôle (Principal / Décideur /
-- Technique / Comptabilité / Autre). Le contact 'primary' est unique par
-- projet (contrainte BDD). Côté V3, projects_v2.client_id est synchronisé
-- avec ce 'primary' pour préserver la compatibilité V1/V2.
--
-- Cette migration est idempotente (CREATE IF NOT EXISTS, DO blocks pour
-- l'enum) et peut être rejouée sans casse.
-- =====================================================================

-- 1. Enum des rôles (idempotent)
DO $$ BEGIN
  CREATE TYPE project_contact_role AS ENUM (
    'primary',
    'decision_maker',
    'technical',
    'billing',
    'other'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Table de liaison
CREATE TABLE IF NOT EXISTS public.project_contacts (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id   uuid NOT NULL REFERENCES public.projects_v2(id) ON DELETE CASCADE,
  contact_id   uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  role         project_contact_role NOT NULL DEFAULT 'other',
  notes        text,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (project_id, contact_id)
);

-- 3. Contrainte : un seul contact 'primary' max par projet
CREATE UNIQUE INDEX IF NOT EXISTS project_contacts_one_primary_per_project
  ON public.project_contacts (project_id)
  WHERE role = 'primary';

-- 4. Index pour les lookups fréquents
CREATE INDEX IF NOT EXISTS idx_project_contacts_project ON public.project_contacts(project_id);
CREATE INDEX IF NOT EXISTS idx_project_contacts_contact ON public.project_contacts(contact_id);

-- 5. RLS : permissif (cohérent avec les autres tables V2 — sécurité au niveau app)
ALTER TABLE public.project_contacts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "project_contacts_read" ON public.project_contacts;
CREATE POLICY "project_contacts_read"
  ON public.project_contacts FOR SELECT TO authenticated
  USING (true);

DROP POLICY IF EXISTS "project_contacts_write" ON public.project_contacts;
CREATE POLICY "project_contacts_write"
  ON public.project_contacts FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- 6. Trigger updated_at (réutilise la fonction set_updated_at existante)
DROP TRIGGER IF EXISTS project_contacts_updated_at ON public.project_contacts;
CREATE TRIGGER project_contacts_updated_at
  BEFORE UPDATE ON public.project_contacts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 7. Migration des données : crée 1 ligne 'primary' pour chaque projet
-- ayant un client_id (compatibilité avec le système V1/V2)
INSERT INTO public.project_contacts (project_id, contact_id, role)
SELECT p.id, p.client_id, 'primary'::project_contact_role
FROM public.projects_v2 p
WHERE p.client_id IS NOT NULL
ON CONFLICT (project_id, contact_id) DO NOTHING;
