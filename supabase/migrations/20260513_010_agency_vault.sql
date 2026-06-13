-- ============================================================
-- Sprint 3B — Coffre-fort agence Propul'seo
-- Table dédiée agency_accesses + 4 RPC SECURITY DEFINER admin-only.
-- Réutilise la passphrase propulseo_access_key créée au Sprint 3A.
--
-- Migration idempotente : peut être rejouée sans casser.
-- ============================================================

-- ----- 1. Pré-requis : extensions et passphrase ----------------
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS supabase_vault;

-- Vérifier que la passphrase existe (créée au Sprint 3A). Sinon la créer.
DO $$
DECLARE
  v_existing uuid;
BEGIN
  SELECT id INTO v_existing FROM vault.secrets WHERE name = 'propulseo_access_key';
  IF v_existing IS NULL THEN
    PERFORM vault.create_secret(
      encode(extensions.gen_random_bytes(32), 'hex'),
      'propulseo_access_key',
      'Passphrase PGP pour coffres projet + agence'
    );
  END IF;
END $$;

-- ----- 2. Table agency_accesses ---------------------------------
CREATE TABLE IF NOT EXISTS public.agency_accesses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category      text NOT NULL CHECK (category IN ('workspace','dev','infra','finance','marketing','saas')),
  label         text NOT NULL,
  url           text,
  login_enc     bytea,
  password_enc  bytea,
  notes_enc     bytea,
  status        text NOT NULL DEFAULT 'active' CHECK (status IN ('active','pending_validation','missing','broken','expired')),
  provided_by   text,
  expires_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_agency_accesses_category ON public.agency_accesses(category);
CREATE INDEX IF NOT EXISTS idx_agency_accesses_status ON public.agency_accesses(status);

-- ----- 3. Trigger updated_at ------------------------------------
DROP TRIGGER IF EXISTS trg_agency_accesses_updated_at ON public.agency_accesses;
CREATE TRIGGER trg_agency_accesses_updated_at
  BEFORE UPDATE ON public.agency_accesses
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ----- 4. RLS admin-only ----------------------------------------
ALTER TABLE public.agency_accesses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS agency_accesses_select_admin ON public.agency_accesses;
CREATE POLICY agency_accesses_select_admin ON public.agency_accesses
  FOR SELECT TO authenticated USING (public.is_admin());

DROP POLICY IF EXISTS agency_accesses_insert_admin ON public.agency_accesses;
CREATE POLICY agency_accesses_insert_admin ON public.agency_accesses
  FOR INSERT TO authenticated WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS agency_accesses_update_admin ON public.agency_accesses;
CREATE POLICY agency_accesses_update_admin ON public.agency_accesses
  FOR UPDATE TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS agency_accesses_delete_admin ON public.agency_accesses;
CREATE POLICY agency_accesses_delete_admin ON public.agency_accesses
  FOR DELETE TO authenticated USING (public.is_admin());

-- ----- 5. RPC SECURITY DEFINER ---------------------------------

CREATE OR REPLACE FUNCTION public.get_decrypted_agency_accesses()
RETURNS TABLE (
  id uuid,
  category text,
  label text,
  url text,
  login text,
  password text,
  notes text,
  status text,
  provided_by text,
  expires_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_passphrase text;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  v_passphrase := public._access_passphrase();
  RETURN QUERY
    SELECT
      a.id, a.category, a.label, a.url,
      CASE WHEN a.login_enc IS NULL THEN NULL ELSE extensions.pgp_sym_decrypt(a.login_enc, v_passphrase) END AS login,
      CASE WHEN a.password_enc IS NULL THEN NULL ELSE extensions.pgp_sym_decrypt(a.password_enc, v_passphrase) END AS password,
      CASE WHEN a.notes_enc IS NULL THEN NULL ELSE extensions.pgp_sym_decrypt(a.notes_enc, v_passphrase) END AS notes,
      a.status, a.provided_by, a.expires_at, a.created_at, a.updated_at
    FROM public.agency_accesses a
    ORDER BY a.category, a.label;
END;
$$;

CREATE OR REPLACE FUNCTION public.get_agency_access_metadata()
RETURNS TABLE (
  id uuid,
  category text,
  label text,
  url text,
  login text,
  password text,
  notes text,
  status text,
  provided_by text,
  expires_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  RETURN QUERY
    SELECT
      a.id, a.category, a.label, a.url,
      NULL::text AS login, NULL::text AS password, NULL::text AS notes,
      a.status, a.provided_by, a.expires_at, a.created_at, a.updated_at
    FROM public.agency_accesses a
    ORDER BY a.category, a.label;
END;
$$;

CREATE OR REPLACE FUNCTION public.upsert_agency_access(
  p_id          uuid,
  p_category    text,
  p_label       text,
  p_url         text,
  p_login       text,
  p_password    text,
  p_notes       text,
  p_status      text,
  p_provided_by text,
  p_expires_at  timestamptz
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_passphrase text;
  v_id uuid;
  v_login_enc bytea;
  v_password_enc bytea;
  v_notes_enc bytea;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  v_passphrase := public._access_passphrase();

  IF p_id IS NULL THEN
    v_login_enc := CASE
      WHEN p_login IS NULL OR p_login = '' THEN NULL
      ELSE extensions.pgp_sym_encrypt(p_login, v_passphrase)
    END;
    v_password_enc := CASE
      WHEN p_password IS NULL OR p_password = '' THEN NULL
      ELSE extensions.pgp_sym_encrypt(p_password, v_passphrase)
    END;
    v_notes_enc := CASE
      WHEN p_notes IS NULL OR p_notes = '' THEN NULL
      ELSE extensions.pgp_sym_encrypt(p_notes, v_passphrase)
    END;
    INSERT INTO public.agency_accesses (
      category, label, url, login_enc, password_enc, notes_enc,
      status, provided_by, expires_at
    ) VALUES (
      p_category, p_label, p_url, v_login_enc, v_password_enc, v_notes_enc,
      p_status, p_provided_by, p_expires_at
    )
    RETURNING id INTO v_id;
  ELSE
    UPDATE public.agency_accesses
    SET
      category = p_category,
      label = p_label,
      url = p_url,
      login_enc = CASE
        WHEN p_login IS NULL THEN login_enc
        WHEN p_login = ''   THEN NULL
        ELSE extensions.pgp_sym_encrypt(p_login, v_passphrase)
      END,
      password_enc = CASE
        WHEN p_password IS NULL THEN password_enc
        WHEN p_password = ''   THEN NULL
        ELSE extensions.pgp_sym_encrypt(p_password, v_passphrase)
      END,
      notes_enc = CASE
        WHEN p_notes IS NULL THEN notes_enc
        WHEN p_notes = ''   THEN NULL
        ELSE extensions.pgp_sym_encrypt(p_notes, v_passphrase)
      END,
      status = p_status,
      provided_by = p_provided_by,
      expires_at = p_expires_at
    WHERE id = p_id
    RETURNING id INTO v_id;
    IF v_id IS NULL THEN
      RAISE EXCEPTION 'agency_access not found' USING ERRCODE = 'P0002';
    END IF;
  END IF;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.delete_agency_access(p_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'forbidden' USING ERRCODE = '42501';
  END IF;
  DELETE FROM public.agency_accesses WHERE id = p_id;
END;
$$;

-- ----- 6. Permissions ------------------------------------------
REVOKE ALL ON FUNCTION public.get_decrypted_agency_accesses() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.get_agency_access_metadata() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.upsert_agency_access(uuid, text, text, text, text, text, text, text, text, timestamptz) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.delete_agency_access(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.get_decrypted_agency_accesses() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_agency_access_metadata() TO authenticated;
GRANT EXECUTE ON FUNCTION public.upsert_agency_access(uuid, text, text, text, text, text, text, text, text, timestamptz) TO authenticated;
GRANT EXECUTE ON FUNCTION public.delete_agency_access(uuid) TO authenticated;
