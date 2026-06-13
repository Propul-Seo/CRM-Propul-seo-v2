-- ============================================================
-- Module Procédures (Wiki interne SOP)
-- ============================================================
-- Tables :
--   - procedure_categories : catégories éditables (admin)
--   - procedures           : fiches wiki (content TipTap JSON)
--   - procedure_revisions  : historique auto par trigger
--
-- Storage bucket : procedure-assets (privé)
-- RLS : lecture pour tous les users `can_view_procedures = true`
--       écriture : admin uniquement (is_admin())
-- RPC  : search_procedures(q) full-text français
-- ============================================================

-- 1. Colonne de permission sur users (default true = rétro-compat)
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS can_view_procedures BOOLEAN NOT NULL DEFAULT true;

-- 2. Table procedure_categories
CREATE TABLE IF NOT EXISTS public.procedure_categories (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  slug        TEXT NOT NULL UNIQUE,
  icon        TEXT,
  color       TEXT,
  sort_order  INTEGER NOT NULL DEFAULT 0,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proc_cat_sort ON public.procedure_categories(sort_order);

-- Seed initial
INSERT INTO public.procedure_categories (name, slug, icon, color, sort_order) VALUES
  ('Noms de domaine',   'noms-de-domaine',   'Globe',        '#8b5cf6', 10),
  ('Hébergement',       'hebergement',       'Server',       '#6366f1', 20),
  ('Email',             'email',             'Mail',         '#0ea5e9', 30),
  ('SEO',               'seo',               'Search',       '#22c55e', 40),
  ('Design',            'design',            'Palette',      '#f59e0b', 50),
  ('Développement',     'developpement',     'Code2',        '#ef4444', 60),
  ('Commercial',        'commercial',        'Briefcase',    '#ec4899', 70),
  ('Administratif',     'administratif',     'FileText',     '#64748b', 80)
ON CONFLICT (slug) DO NOTHING;

-- 3. Table procedures (fiches)
CREATE TABLE IF NOT EXISTS public.procedures (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title         TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,
  category_id   UUID REFERENCES public.procedure_categories(id) ON DELETE SET NULL,
  tags          TEXT[] NOT NULL DEFAULT '{}',
  content       JSONB NOT NULL DEFAULT '{"type":"doc","content":[]}'::jsonb,
  content_text  TEXT,
  summary       TEXT,
  author_id     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  is_pinned     BOOLEAN NOT NULL DEFAULT false,
  is_archived   BOOLEAN NOT NULL DEFAULT false,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proc_category ON public.procedures(category_id);
CREATE INDEX IF NOT EXISTS idx_proc_updated  ON public.procedures(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_proc_archived ON public.procedures(is_archived);
CREATE INDEX IF NOT EXISTS idx_proc_pinned   ON public.procedures(is_pinned) WHERE is_pinned = true;
CREATE INDEX IF NOT EXISTS idx_proc_tags     ON public.procedures USING GIN (tags);

-- Wrapper IMMUTABLE pour l'index FTS : l'implicit cast text->regconfig est STABLE,
-- donc `to_tsvector('french', ...)` ne peut pas être utilisé directement dans un index.
-- On fige la config 'french' dans une fonction IMMUTABLE.
CREATE OR REPLACE FUNCTION public.procedures_fts_vector(
  p_title text, p_summary text, p_content_text text, p_tags text[]
) RETURNS tsvector
LANGUAGE sql IMMUTABLE PARALLEL SAFE AS $$
  SELECT to_tsvector('french'::regconfig,
    coalesce(p_title,'') || ' ' ||
    coalesce(p_summary,'') || ' ' ||
    coalesce(p_content_text,'') || ' ' ||
    coalesce(array_to_string(p_tags, ' '), '')
  )
$$;

CREATE INDEX IF NOT EXISTS idx_proc_fts
  ON public.procedures
  USING GIN (public.procedures_fts_vector(title, summary, content_text, tags));

-- 4. Table procedure_revisions (historique)
CREATE TABLE IF NOT EXISTS public.procedure_revisions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  procedure_id  UUID NOT NULL REFERENCES public.procedures(id) ON DELETE CASCADE,
  title         TEXT NOT NULL,
  content       JSONB NOT NULL,
  content_text  TEXT,
  summary       TEXT,
  change_note   TEXT,
  edited_by     UUID REFERENCES public.users(id) ON DELETE SET NULL,
  edited_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_proc_rev_procedure ON public.procedure_revisions(procedure_id, edited_at DESC);

-- 5. Trigger updated_at (utilise la fonction existante set_updated_at)
DROP TRIGGER IF EXISTS trg_procedures_updated_at ON public.procedures;
CREATE TRIGGER trg_procedures_updated_at
  BEFORE UPDATE ON public.procedures
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6. Trigger d'historique automatique : avant UPDATE, sauvegarde l'ancienne version
CREATE OR REPLACE FUNCTION public.log_procedure_revision()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  -- On ne logge que si le contenu ou le titre change
  IF (OLD.content IS DISTINCT FROM NEW.content
      OR OLD.title IS DISTINCT FROM NEW.title
      OR OLD.summary IS DISTINCT FROM NEW.summary) THEN
    INSERT INTO public.procedure_revisions
      (procedure_id, title, content, content_text, summary, change_note, edited_by)
    VALUES
      (OLD.id, OLD.title, OLD.content, OLD.content_text, OLD.summary, NULL, OLD.updated_by);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_procedures_revision ON public.procedures;
CREATE TRIGGER trg_procedures_revision
  BEFORE UPDATE ON public.procedures
  FOR EACH ROW EXECUTE FUNCTION public.log_procedure_revision();

-- 7. RPC recherche full-text français (utilise le wrapper IMMUTABLE + l'index FTS)
CREATE OR REPLACE FUNCTION public.search_procedures(q TEXT)
RETURNS SETOF public.procedures
LANGUAGE sql STABLE AS $$
  SELECT *
  FROM public.procedures
  WHERE is_archived = false
    AND public.procedures_fts_vector(title, summary, content_text, tags)
        @@ plainto_tsquery('french'::regconfig, q)
  ORDER BY ts_rank(
    public.procedures_fts_vector(title, summary, content_text, tags),
    plainto_tsquery('french'::regconfig, q)
  ) DESC
  LIMIT 50;
$$;

-- ============================================================
-- RLS
-- ============================================================

ALTER TABLE public.procedure_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedures            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.procedure_revisions   ENABLE ROW LEVEL SECURITY;

-- procedure_categories : lecture pour users autorisés, écriture admin
DROP POLICY IF EXISTS "Read procedure categories" ON public.procedure_categories;
CREATE POLICY "Read procedure categories"
  ON public.procedure_categories FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_user_id = auth.uid()
        AND can_view_procedures = true
    )
  );

DROP POLICY IF EXISTS "Admin write procedure categories" ON public.procedure_categories;
CREATE POLICY "Admin write procedure categories"
  ON public.procedure_categories FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- procedures : lecture fiches non archivées pour users autorisés, écriture admin
DROP POLICY IF EXISTS "Read procedures" ON public.procedures;
CREATE POLICY "Read procedures"
  ON public.procedures FOR SELECT TO authenticated
  USING (
    is_archived = false
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_user_id = auth.uid()
        AND can_view_procedures = true
    )
  );

DROP POLICY IF EXISTS "Admin read archived procedures" ON public.procedures;
CREATE POLICY "Admin read archived procedures"
  ON public.procedures FOR SELECT TO authenticated
  USING (is_admin());

DROP POLICY IF EXISTS "Admin write procedures" ON public.procedures;
CREATE POLICY "Admin write procedures"
  ON public.procedures FOR ALL TO authenticated
  USING (is_admin()) WITH CHECK (is_admin());

-- procedure_revisions : lecture admin uniquement (historique sensible)
DROP POLICY IF EXISTS "Admin read procedure revisions" ON public.procedure_revisions;
CREATE POLICY "Admin read procedure revisions"
  ON public.procedure_revisions FOR SELECT TO authenticated
  USING (is_admin());

-- Insert via trigger uniquement : on autorise insert pour authenticated
-- (le trigger s'exécute dans le contexte de l'appelant, admin forcément ici)
DROP POLICY IF EXISTS "Trigger insert procedure revisions" ON public.procedure_revisions;
CREATE POLICY "Trigger insert procedure revisions"
  ON public.procedure_revisions FOR INSERT TO authenticated
  WITH CHECK (is_admin());

-- ============================================================
-- Storage bucket procedure-assets
-- ============================================================

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'procedure-assets',
  'procedure-assets',
  false,
  10485760,  -- 10 MB
  -- SVG exclu : risque XSS si l'URL signée est ouverte directement
  ARRAY[
    'image/png','image/jpeg','image/webp','image/gif',
    'application/pdf'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Policies storage : lecture pour users autorisés, upload/delete admin
DROP POLICY IF EXISTS "Read procedure assets" ON storage.objects;
CREATE POLICY "Read procedure assets"
  ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id = 'procedure-assets'
    AND EXISTS (
      SELECT 1 FROM public.users
      WHERE auth_user_id = auth.uid()
        AND can_view_procedures = true
    )
  );

DROP POLICY IF EXISTS "Admin upload procedure assets" ON storage.objects;
CREATE POLICY "Admin upload procedure assets"
  ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'procedure-assets' AND is_admin());

DROP POLICY IF EXISTS "Admin update procedure assets" ON storage.objects;
CREATE POLICY "Admin update procedure assets"
  ON storage.objects FOR UPDATE TO authenticated
  USING (bucket_id = 'procedure-assets' AND is_admin());

DROP POLICY IF EXISTS "Admin delete procedure assets" ON storage.objects;
CREATE POLICY "Admin delete procedure assets"
  ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'procedure-assets' AND is_admin());
