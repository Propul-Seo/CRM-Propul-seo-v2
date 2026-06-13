-- ============================================================================
-- Migration 248 — BLOC 4 : suppression de projets/leads (hard delete + archive)
-- ============================================================================
-- But : ajouter le hard delete propre pour les projets et les leads qualif,
-- en respectant l'obligation légale de conservation des factures/signatures.
--
-- 1. ADD COLUMN projects_v2.archived_at — date d'archivage soft (status='archived')
-- 2. ALTER FK invoices.project_id  → ON DELETE CASCADE (au lieu de RESTRICT)
-- 3. ALTER FK signatures.project_id → ON DELETE CASCADE
-- 4. Fonction propulspace.admin_inspect_project_deps(uuid)
--    → renvoie le compte des dépendances (factures, signatures, docs, portail)
--    → permet au front de décider quel dialog afficher (simple ou renforcé)
-- 5. Fonction propulspace.admin_archive_project(uuid)
--    → UPDATE status='archived' + archived_at=NOW(). Aucune donnée perdue.
-- 6. Fonction propulspace.admin_delete_project(uuid, p_force boolean)
--    → DELETE le projet (cascade auto via FK)
--    → renvoie la liste des paths Storage à cleanup côté edge function
--    → REJECT si dépendances présentes ET p_force=false
-- 7. Fonction propulspace.admin_delete_qualif_lead(uuid)
--    → DELETE le lead (cascade qualification_uploads)
--    → REJECT si status='converted' (passer par admin_delete_project)
--    → renvoie les paths Storage à cleanup
--
-- Garde-fous :
--   • Toutes les fonctions sont SECURITY DEFINER + check propulspace.is_admin()
--     → seuls admin/manager peuvent supprimer. Sales/marketing/dev/ops bloqués.
--   • Wrappers public.* pour exposition PostgREST.
--   • Aucun trigger automatique : la suppression est toujours déclenchée
--     explicitement par un admin via UI + confirmation typée côté front.
--
-- Rollback : voir tout en bas, section commentée.
-- ============================================================================

-- ───────────────────────────────────────────────────────────────────────────
-- 1. Colonne archived_at sur projects_v2
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE public.projects_v2
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;

COMMENT ON COLUMN public.projects_v2.archived_at IS
  'Horodatage de l''archivage soft (status=archived). NULL = projet actif. Renseigné automatiquement par propulspace.admin_archive_project.';

-- ───────────────────────────────────────────────────────────────────────────
-- 2. Passer FK invoices + signatures en ON DELETE CASCADE
-- ───────────────────────────────────────────────────────────────────────────

ALTER TABLE propulspace.invoices DROP CONSTRAINT IF EXISTS invoices_project_id_fkey;
ALTER TABLE propulspace.invoices ADD CONSTRAINT invoices_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects_v2(id) ON DELETE CASCADE;

ALTER TABLE propulspace.signatures DROP CONSTRAINT IF EXISTS signatures_project_id_fkey;
ALTER TABLE propulspace.signatures ADD CONSTRAINT signatures_project_id_fkey
  FOREIGN KEY (project_id) REFERENCES public.projects_v2(id) ON DELETE CASCADE;

-- ───────────────────────────────────────────────────────────────────────────
-- 3. RPC inspect_project_deps — état des lieux avant suppression
-- ───────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION propulspace.admin_inspect_project_deps(p_project_id UUID)
RETURNS TABLE(
  project_name TEXT,
  project_status TEXT,
  invoices_count INT,
  signatures_count INT,
  documents_count INT,
  has_portal BOOLEAN,
  has_qualif_lead BOOLEAN
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = propulspace, public, pg_temp
AS $$
BEGIN
  IF NOT propulspace.is_admin() THEN
    RAISE EXCEPTION 'Accès refusé : seuls les admins/managers peuvent inspecter un projet' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
  SELECT
    p.name,
    p.status,
    (SELECT COUNT(*)::INT FROM propulspace.invoices    WHERE project_id = p.id),
    (SELECT COUNT(*)::INT FROM propulspace.signatures  WHERE project_id = p.id),
    (SELECT COUNT(*)::INT FROM propulspace.documents   WHERE project_id = p.id),
    (p.portal_client_email IS NOT NULL),
    EXISTS(SELECT 1 FROM propulspace.qualification_leads WHERE converted_to_project_id = p.id)
  FROM public.projects_v2 p
  WHERE p.id = p_project_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION propulspace.admin_inspect_project_deps(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION propulspace.admin_inspect_project_deps(UUID) TO authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 4. RPC admin_archive_project — soft delete sans perte de données
-- ───────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION propulspace.admin_archive_project(p_project_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = propulspace, public, pg_temp
AS $$
DECLARE
  v_id UUID;
BEGIN
  IF NOT propulspace.is_admin() THEN
    RAISE EXCEPTION 'Accès refusé : seuls les admins/managers peuvent archiver un projet' USING ERRCODE = '42501';
  END IF;

  UPDATE public.projects_v2
     SET status = 'archived',
         archived_at = NOW(),
         updated_at = NOW()
   WHERE id = p_project_id
  RETURNING id INTO v_id;

  IF v_id IS NULL THEN
    RAISE EXCEPTION 'Projet introuvable' USING ERRCODE = 'P0002';
  END IF;

  RETURN v_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION propulspace.admin_archive_project(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION propulspace.admin_archive_project(UUID) TO authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 5. RPC admin_delete_project — hard delete avec cleanup Storage paths
-- ───────────────────────────────────────────────────────────────────────────
-- Retourne un JSON pour que le front puisse :
--   • lister les fichiers Storage à supprimer ensuite via edge function
--   • afficher un message de succès clair
-- Si p_force=false ET dépendances présentes → exception.

CREATE OR REPLACE FUNCTION propulspace.admin_delete_project(
  p_project_id UUID,
  p_force BOOLEAN DEFAULT false
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = propulspace, public, pg_temp
AS $$
DECLARE
  v_name TEXT;
  v_inv_count INT;
  v_sig_count INT;
  v_doc_paths TEXT[];
  v_upload_paths TEXT[];
BEGIN
  IF NOT propulspace.is_admin() THEN
    RAISE EXCEPTION 'Accès refusé : seuls les admins/managers peuvent supprimer un projet' USING ERRCODE = '42501';
  END IF;

  -- Lock le projet pour la durée de la transaction
  SELECT name INTO v_name FROM public.projects_v2 WHERE id = p_project_id FOR UPDATE;
  IF v_name IS NULL THEN
    RAISE EXCEPTION 'Projet introuvable' USING ERRCODE = 'P0002';
  END IF;

  -- Compter les dépendances "lourdes"
  SELECT COUNT(*)::INT INTO v_inv_count FROM propulspace.invoices   WHERE project_id = p_project_id;
  SELECT COUNT(*)::INT INTO v_sig_count FROM propulspace.signatures WHERE project_id = p_project_id;

  -- Garde-fou : si dépendances et pas de force, on refuse
  IF (v_inv_count > 0 OR v_sig_count > 0) AND NOT p_force THEN
    RAISE EXCEPTION 'Projet a des données légales (factures: %, signatures: %). Utiliser archive ou p_force=true.', v_inv_count, v_sig_count
      USING ERRCODE = '23514';
  END IF;

  -- Collecter les paths Storage AVANT le DELETE cascade
  SELECT COALESCE(ARRAY_AGG(file_url) FILTER (WHERE file_url IS NOT NULL), '{}')
    INTO v_doc_paths
    FROM propulspace.documents WHERE project_id = p_project_id;

  -- Uploads qualif rattachés au lead converti (si existe)
  SELECT COALESCE(ARRAY_AGG(DISTINCT u.file_url) FILTER (WHERE u.file_url IS NOT NULL), '{}')
    INTO v_upload_paths
    FROM propulspace.qualification_leads ql
    JOIN propulspace.qualification_uploads u ON u.qualification_lead_id = ql.id
    WHERE ql.converted_to_project_id = p_project_id;

  -- DELETE — cascade automatique (documents, project_steps, onboarding,
  -- invoices, signatures, qualification_leads via converted_to → SET NULL)
  DELETE FROM public.projects_v2 WHERE id = p_project_id;

  RETURN jsonb_build_object(
    'project_id', p_project_id,
    'project_name', v_name,
    'forced', p_force,
    'cascade_counts', jsonb_build_object(
      'invoices', v_inv_count,
      'signatures', v_sig_count
    ),
    'storage_paths_to_cleanup', jsonb_build_object(
      'documents_bucket_paths', to_jsonb(v_doc_paths),
      'uploads_bucket_paths',   to_jsonb(v_upload_paths)
    )
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION propulspace.admin_delete_project(UUID, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION propulspace.admin_delete_project(UUID, BOOLEAN) TO authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 6. RPC admin_delete_qualif_lead — hard delete lead non converti
-- ───────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION propulspace.admin_delete_qualif_lead(p_lead_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = propulspace, public, pg_temp
AS $$
DECLARE
  v_name TEXT;
  v_status TEXT;
  v_converted_to UUID;
  v_upload_paths TEXT[];
BEGIN
  IF NOT propulspace.is_admin() THEN
    RAISE EXCEPTION 'Accès refusé : seuls les admins/managers peuvent supprimer un lead' USING ERRCODE = '42501';
  END IF;

  SELECT full_name, status, converted_to_project_id
    INTO v_name, v_status, v_converted_to
    FROM propulspace.qualification_leads
    WHERE id = p_lead_id FOR UPDATE;

  IF v_name IS NULL THEN
    RAISE EXCEPTION 'Lead introuvable' USING ERRCODE = 'P0002';
  END IF;

  -- Garde-fou : interdire suppression d'un lead déjà converti
  IF v_status = 'converted' OR v_converted_to IS NOT NULL THEN
    RAISE EXCEPTION 'Ce lead est déjà converti en projet (id: %). Supprimer le projet à la place.', v_converted_to
      USING ERRCODE = '23514';
  END IF;

  -- Collecter les paths Storage avant DELETE
  SELECT COALESCE(ARRAY_AGG(file_url) FILTER (WHERE file_url IS NOT NULL), '{}')
    INTO v_upload_paths
    FROM propulspace.qualification_uploads
    WHERE qualification_lead_id = p_lead_id;

  -- DELETE (cascade qualification_uploads automatique)
  DELETE FROM propulspace.qualification_leads WHERE id = p_lead_id;

  RETURN jsonb_build_object(
    'lead_id', p_lead_id,
    'lead_name', v_name,
    'storage_paths_to_cleanup', jsonb_build_object(
      'uploads_bucket_paths', to_jsonb(v_upload_paths)
    )
  );
END;
$$;

REVOKE EXECUTE ON FUNCTION propulspace.admin_delete_qualif_lead(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION propulspace.admin_delete_qualif_lead(UUID) TO authenticated;

-- ───────────────────────────────────────────────────────────────────────────
-- 7. Wrappers PostgREST dans public
-- ───────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.admin_inspect_project_deps(p_project_id UUID)
RETURNS TABLE(
  project_name TEXT, project_status TEXT,
  invoices_count INT, signatures_count INT, documents_count INT,
  has_portal BOOLEAN, has_qualif_lead BOOLEAN
)
LANGUAGE sql STABLE SET search_path = public, pg_temp
AS $$ SELECT * FROM propulspace.admin_inspect_project_deps(p_project_id); $$;

CREATE OR REPLACE FUNCTION public.admin_archive_project(p_project_id UUID)
RETURNS UUID LANGUAGE sql VOLATILE SET search_path = public, pg_temp
AS $$ SELECT propulspace.admin_archive_project(p_project_id); $$;

CREATE OR REPLACE FUNCTION public.admin_delete_project(p_project_id UUID, p_force BOOLEAN DEFAULT false)
RETURNS JSONB LANGUAGE sql VOLATILE SET search_path = public, pg_temp
AS $$ SELECT propulspace.admin_delete_project(p_project_id, p_force); $$;

CREATE OR REPLACE FUNCTION public.admin_delete_qualif_lead(p_lead_id UUID)
RETURNS JSONB LANGUAGE sql VOLATILE SET search_path = public, pg_temp
AS $$ SELECT propulspace.admin_delete_qualif_lead(p_lead_id); $$;

REVOKE EXECUTE ON FUNCTION public.admin_inspect_project_deps(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_archive_project(UUID) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_project(UUID, BOOLEAN) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.admin_delete_qualif_lead(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.admin_inspect_project_deps(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_archive_project(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_project(UUID, BOOLEAN) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_delete_qualif_lead(UUID) TO authenticated;

-- ============================================================================
-- ROLLBACK (commenté)
-- ============================================================================
-- DROP FUNCTION IF EXISTS public.admin_inspect_project_deps(UUID);
-- DROP FUNCTION IF EXISTS public.admin_archive_project(UUID);
-- DROP FUNCTION IF EXISTS public.admin_delete_project(UUID, BOOLEAN);
-- DROP FUNCTION IF EXISTS public.admin_delete_qualif_lead(UUID);
-- DROP FUNCTION IF EXISTS propulspace.admin_inspect_project_deps(UUID);
-- DROP FUNCTION IF EXISTS propulspace.admin_archive_project(UUID);
-- DROP FUNCTION IF EXISTS propulspace.admin_delete_project(UUID, BOOLEAN);
-- DROP FUNCTION IF EXISTS propulspace.admin_delete_qualif_lead(UUID);
-- ALTER TABLE propulspace.invoices DROP CONSTRAINT invoices_project_id_fkey;
-- ALTER TABLE propulspace.invoices ADD CONSTRAINT invoices_project_id_fkey
--   FOREIGN KEY (project_id) REFERENCES public.projects_v2(id);
-- ALTER TABLE propulspace.signatures DROP CONSTRAINT signatures_project_id_fkey;
-- ALTER TABLE propulspace.signatures ADD CONSTRAINT signatures_project_id_fkey
--   FOREIGN KEY (project_id) REFERENCES public.projects_v2(id);
-- ALTER TABLE public.projects_v2 DROP COLUMN archived_at;
