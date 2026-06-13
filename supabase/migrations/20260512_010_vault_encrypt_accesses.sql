-- ============================================================
-- Sprint 3A — Coffre-fort projet : chiffrement des accès
-- via pgcrypto (PGP symétrique) + Supabase Vault pour la passphrase.
--
-- Migration idempotente : peut être rejouée sans casser.
-- Contexte : pgsodium déprécié sur Supabase hébergé, on bascule sur
-- pgcrypto.pgp_sym_encrypt/decrypt avec une passphrase dans vault.secrets.
-- ============================================================

-- ----- 1. Extensions ----------------------------------------
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS supabase_vault;

-- ----- 1bis. Patch public.is_admin() ------------------------
-- Nos RPC utilisent SET search_path = '' pour la sécurité. La fonction is_admin()
-- existante faisait FROM users (sans schéma) → cassée quand appelée depuis nos RPC.
-- On la patche pour qualifier public.users + SET search_path explicite.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $function$
DECLARE
    user_role TEXT;
    user_email TEXT;
BEGIN
    SELECT role, email INTO user_role, user_email
    FROM public.users
    WHERE auth_user_id = auth.uid();

    -- COALESCE pour garantir false (pas NULL) si l'user n'existe pas dans public.users
    RETURN COALESCE(
      user_role = 'admin' OR user_email = 'team@propulseo-site.com',
      false
    );
END;
$function$;

-- ----- 2. Secret de chiffrement dans Vault ------------------
-- Crée la passphrase aléatoire 32 bytes hex la première fois.
-- Si elle existe déjà, ne fait rien (idempotent).
DO $$
DECLARE
  v_existing uuid;
BEGIN
  SELECT id INTO v_existing
  FROM vault.secrets
  WHERE name = 'propulseo_access_key';

  IF v_existing IS NULL THEN
    PERFORM vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'propulseo_access_key',
      'Passphrase PGP pour chiffrer login/password/notes du coffre projet'
    );
  END IF;
END $$;

-- ----- 3. Backup de sécurité avant DDL destructif -----------
CREATE TABLE IF NOT EXISTS public.project_accesses_v2_backup_20260512 AS
  SELECT * FROM public.project_accesses_v2;

-- ----- 4. Helper privé pour lire la passphrase --------------
-- INVARIANT CRITIQUE : tout appelant doit vérifier is_admin() en tête.
-- Ce helper n'a PAS de garde interne (lecture ferme côté Vault uniquement).
-- Note : pas de garde is_admin() interne car la migration elle-même appelle
-- ce helper côté server (auth.uid() = NULL → is_admin() = false → blocage migration).
-- La protection est assurée par REVOKE + checks dans les RPC consommatrices.
CREATE OR REPLACE FUNCTION public._access_passphrase()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT decrypted_secret
  FROM vault.decrypted_secrets
  WHERE name = 'propulseo_access_key'
  LIMIT 1;
$$;

COMMENT ON FUNCTION public._access_passphrase() IS
  'INVARIANT: callers MUST check is_admin() — this helper has no internal guard. Used by get_decrypted_accesses() and upsert_access().';

REVOKE ALL ON FUNCTION public._access_passphrase() FROM PUBLIC;
REVOKE ALL ON FUNCTION public._access_passphrase() FROM anon, authenticated;

-- ----- 5a. DROP vue de compat héritée -----------------------
-- v2.project_accesses est une vue projetant les colonnes claires (login/password/notes).
-- Aucun code TS ne l'utilise (le proxy v2 cible directement public.project_accesses_v2).
-- On la drop pour libérer les dépendances avant DROP COLUMN. La vue sera recréée à la
-- demande dans une migration future si besoin (pointant vers les RPC).
DROP VIEW IF EXISTS v2.project_accesses CASCADE;

-- ----- 5b. Colonnes chiffrées -------------------------------
ALTER TABLE public.project_accesses_v2
  ADD COLUMN IF NOT EXISTS login_enc    bytea,
  ADD COLUMN IF NOT EXISTS password_enc bytea,
  ADD COLUMN IF NOT EXISTS notes_enc    bytea;

-- ----- 6. Migration des données + DROP transactionnel -------
-- Le DO block garantit l'atomicité : si l'assertion échoue, RAISE
-- déclenche un rollback automatique et les colonnes TEXT restent intactes.
DO $$
DECLARE
  v_pass    text;
  v_orphans int;
BEGIN
  v_pass := public._access_passphrase();
  IF v_pass IS NULL THEN
    RAISE EXCEPTION 'Vault secret "propulseo_access_key" introuvable — vérifier vault.secrets' USING ERRCODE = 'P0002';
  END IF;

  -- 6a. Chiffrement idempotent (skip si déjà chiffré)
  -- Cast text → bytea implicite pour pgp_sym_encrypt (signature: text, text → bytea)
  UPDATE public.project_accesses_v2
    SET login_enc = extensions.pgp_sym_encrypt(login, v_pass)
    WHERE login IS NOT NULL AND login <> '' AND login_enc IS NULL;

  UPDATE public.project_accesses_v2
    SET password_enc = extensions.pgp_sym_encrypt(password, v_pass)
    WHERE password IS NOT NULL AND password <> '' AND password_enc IS NULL;

  UPDATE public.project_accesses_v2
    SET notes_enc = extensions.pgp_sym_encrypt(notes, v_pass)
    WHERE notes IS NOT NULL AND notes <> '' AND notes_enc IS NULL;

  -- 6b. ASSERTION DE COMPLÉTUDE (bloque le DROP si une row n'a pas été chiffrée)
  SELECT count(*) INTO v_orphans
    FROM public.project_accesses_v2
    WHERE (login    IS NOT NULL AND login    <> '' AND login_enc    IS NULL)
       OR (password IS NOT NULL AND password <> '' AND password_enc IS NULL)
       OR (notes    IS NOT NULL AND notes    <> '' AND notes_enc    IS NULL);

  IF v_orphans > 0 THEN
    RAISE EXCEPTION
      'Chiffrement incomplet (% rows orphelines), DROP annulé. Restore via public.project_accesses_v2_backup_20260512',
      v_orphans;
  END IF;
END $$;

-- 6c. DROP des colonnes claires (atomique au niveau ALTER TABLE)
ALTER TABLE public.project_accesses_v2
  DROP COLUMN IF EXISTS login,
  DROP COLUMN IF EXISTS password,
  DROP COLUMN IF EXISTS notes;

-- ----- 7. Index ---------------------------------------------
CREATE INDEX IF NOT EXISTS idx_project_accesses_v2_project
  ON public.project_accesses_v2(project_id);

-- ----- 8. Trigger updated_at --------------------------------
-- Drop l'ancien nom (créé par migration 20260405) ET le nouveau, pour éviter doublon
DROP TRIGGER IF EXISTS trg_accesses_v2_updated_at      ON public.project_accesses_v2;
DROP TRIGGER IF EXISTS trg_project_accesses_v2_updated ON public.project_accesses_v2;
CREATE TRIGGER trg_project_accesses_v2_updated
  BEFORE UPDATE ON public.project_accesses_v2
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----- 9. RLS admin-only ------------------------------------
ALTER TABLE public.project_accesses_v2 ENABLE ROW LEVEL SECURITY;

-- Cleanup d'éventuelles policies legacy
DROP POLICY IF EXISTS "accesses_admin_select" ON public.project_accesses_v2;
DROP POLICY IF EXISTS "accesses_admin_insert" ON public.project_accesses_v2;
DROP POLICY IF EXISTS "accesses_admin_update" ON public.project_accesses_v2;
DROP POLICY IF EXISTS "accesses_admin_delete" ON public.project_accesses_v2;
DROP POLICY IF EXISTS "dev_all_accesses_v2"   ON public.project_accesses_v2;
DROP POLICY IF EXISTS "Authenticated all accesses" ON public.project_accesses_v2;

CREATE POLICY "accesses_admin_select" ON public.project_accesses_v2
  FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "accesses_admin_insert" ON public.project_accesses_v2
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "accesses_admin_update" ON public.project_accesses_v2
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());
CREATE POLICY "accesses_admin_delete" ON public.project_accesses_v2
  FOR DELETE TO authenticated USING (public.is_admin());

-- ============================================================
-- RPC publiques (appelées depuis le client via supabase.rpc())
-- ============================================================

-- ----- 10. Lecture admin (avec secrets déchiffrés) ----------
CREATE OR REPLACE FUNCTION public.get_decrypted_accesses(p_project_id uuid)
RETURNS TABLE(
  id                  uuid,
  project_id          uuid,
  category            text,
  label               text,
  url                 text,
  login               text,
  password            text,
  notes               text,
  status              text,
  provided_by         text,
  expires_at          timestamptz,
  detected_from_email boolean,
  created_at          timestamptz,
  updated_at          timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_pass text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden: admin only' USING ERRCODE = '42501';
  END IF;

  v_pass := public._access_passphrase();

  RETURN QUERY
    SELECT
      a.id,
      a.project_id,
      a.category,
      a.label,
      a.url,
      CASE WHEN a.login_enc    IS NOT NULL THEN extensions.pgp_sym_decrypt(a.login_enc,    v_pass) END,
      CASE WHEN a.password_enc IS NOT NULL THEN extensions.pgp_sym_decrypt(a.password_enc, v_pass) END,
      CASE WHEN a.notes_enc    IS NOT NULL THEN extensions.pgp_sym_decrypt(a.notes_enc,    v_pass) END,
      a.status,
      a.provided_by,
      a.expires_at,
      a.detected_from_email,
      a.created_at,
      a.updated_at
    FROM public.project_accesses_v2 a
    WHERE a.project_id = p_project_id
    ORDER BY a.category, a.label;
END
$$;

-- ----- 11. Lecture métadonnées (tout authentifié, pas de secrets) -
-- DESIGN INTENTIONNEL : tout user authentifié peut voir les métadonnées (label,
-- url, statut, catégorie) de n'importe quel projet, sans check d'appartenance.
-- Seuls login/password/notes restent admin-only via get_decrypted_accesses().
-- Si besoin de scoping par projet plus tard : ajouter un check EXISTS sur
-- projects_v2.assigned_to ou équivalent.
CREATE OR REPLACE FUNCTION public.get_access_metadata(p_project_id uuid)
RETURNS TABLE(
  id                  uuid,
  project_id          uuid,
  category            text,
  label               text,
  url                 text,
  status              text,
  provided_by         text,
  expires_at          timestamptz,
  detected_from_email boolean,
  created_at          timestamptz,
  updated_at          timestamptz
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT a.id, a.project_id, a.category, a.label, a.url, a.status,
         a.provided_by, a.expires_at, a.detected_from_email,
         a.created_at, a.updated_at
  FROM public.project_accesses_v2 a
  WHERE a.project_id = p_project_id
  ORDER BY a.category, a.label;
$$;

-- ----- 12. Upsert admin -------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_access(
  p_id          uuid,
  p_project_id  uuid,
  p_category    text,
  p_label       text,
  p_url         text,
  p_login       text,
  p_password    text,
  p_notes       text,
  p_status      text,
  p_provided_by text,
  p_expires_at  timestamptz
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_pass text;
  v_id   uuid;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden: admin only' USING ERRCODE = '42501';
  END IF;

  v_pass := public._access_passphrase();
  IF v_pass IS NULL THEN
    RAISE EXCEPTION 'Vault secret "propulseo_access_key" introuvable' USING ERRCODE = 'P0002';
  END IF;

  IF p_id IS NOT NULL THEN
    -- Convention secrets : NULL = ne touche pas, '' = efface, valeur = remplace
    UPDATE public.project_accesses_v2 SET
      category     = COALESCE(p_category, category),
      label        = COALESCE(p_label, label),
      url          = p_url,
      login_enc    = CASE
                       WHEN p_login IS NULL THEN login_enc
                       WHEN p_login = ''    THEN NULL
                       ELSE extensions.pgp_sym_encrypt(p_login, v_pass)
                     END,
      password_enc = CASE
                       WHEN p_password IS NULL THEN password_enc
                       WHEN p_password = ''    THEN NULL
                       ELSE extensions.pgp_sym_encrypt(p_password, v_pass)
                     END,
      notes_enc    = CASE
                       WHEN p_notes IS NULL THEN notes_enc
                       WHEN p_notes = ''    THEN NULL
                       ELSE extensions.pgp_sym_encrypt(p_notes, v_pass)
                     END,
      status       = COALESCE(p_status, status),
      provided_by  = p_provided_by,
      expires_at   = p_expires_at
    WHERE id = p_id
    RETURNING id INTO v_id;
  ELSE
    INSERT INTO public.project_accesses_v2 (
      project_id, category, label, url,
      login_enc, password_enc, notes_enc,
      status, provided_by, expires_at, detected_from_email
    ) VALUES (
      p_project_id,
      COALESCE(p_category, 'tools'),
      p_label,
      p_url,
      CASE WHEN p_login    IS NOT NULL AND p_login    <> '' THEN extensions.pgp_sym_encrypt(p_login,    v_pass) END,
      CASE WHEN p_password IS NOT NULL AND p_password <> '' THEN extensions.pgp_sym_encrypt(p_password, v_pass) END,
      CASE WHEN p_notes    IS NOT NULL AND p_notes    <> '' THEN extensions.pgp_sym_encrypt(p_notes,    v_pass) END,
      COALESCE(p_status, 'active'),
      p_provided_by,
      p_expires_at,
      false
    )
    RETURNING id INTO v_id;
  END IF;

  RETURN v_id;
END
$$;

-- ----- 13. Delete admin -------------------------------------
CREATE OR REPLACE FUNCTION public.delete_access(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden: admin only' USING ERRCODE = '42501';
  END IF;
  DELETE FROM public.project_accesses_v2 WHERE id = p_id;
END
$$;

-- ----- 14. Grants -------------------------------------------
GRANT EXECUTE ON FUNCTION public.get_decrypted_accesses(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_access_metadata(uuid)    TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_access(uuid, uuid, text, text, text, text, text, text, text, text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_access(uuid)          TO authenticated;
