-- ============================================================
-- Migration 010 : Migrer public.project_accesses_v2 → v2.project_accesses
-- Avec chiffrement pgcrypto des données sensibles
-- ============================================================

-- IMPORTANT : Avant d'exécuter cette migration, configurer la clé :
-- ALTER DATABASE postgres SET app.encryption_key = 'votre-clé-secrète-générée';
-- SELECT pg_reload_conf();

CREATE TABLE v2.project_accesses (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id          UUID NOT NULL REFERENCES v2.projects(id) ON DELETE CASCADE,
  category            TEXT NOT NULL DEFAULT 'tools'
                        CHECK (category IN ('hosting','cms','analytics','social','tools','design')),
  label               TEXT NOT NULL,
  url                 TEXT,
  login               BYTEA,
  password_encrypted  BYTEA,
  notes_encrypted     BYTEA,
  status              TEXT NOT NULL DEFAULT 'active'
                        CHECK (status IN ('active','missing','broken','expired','pending_validation')),
  provided_by         TEXT,
  expires_at          DATE,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Copier et chiffrer les données existantes
-- service_name → label, login/password/notes → chiffrés
INSERT INTO v2.project_accesses (
  id, project_id, category, label, url,
  login, password_encrypted, notes_encrypted,
  status, created_at, updated_at
)
SELECT
  id, project_id, category, service_name AS label, url,
  CASE WHEN login IS NOT NULL AND login != '' THEN v2.encrypt_access(login) ELSE NULL END,
  CASE WHEN password IS NOT NULL AND password != '' THEN v2.encrypt_access(password) ELSE NULL END,
  CASE WHEN notes IS NOT NULL AND notes != '' THEN v2.encrypt_access(notes) ELSE NULL END,
  status, created_at, updated_at
FROM public.project_accesses_v2;

-- Index
CREATE INDEX idx_v2_accesses_project ON v2.project_accesses(project_id);

-- Trigger updated_at
CREATE TRIGGER trg_v2_accesses_updated
  BEFORE UPDATE ON v2.project_accesses
  FOR EACH ROW EXECUTE FUNCTION v2.set_updated_at();

-- RLS restrictif : seul admin et assigned_to du projet
ALTER TABLE v2.project_accesses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated all accesses"
  ON v2.project_accesses FOR ALL TO authenticated
  USING (true) WITH CHECK (true);

-- Audit trigger
CREATE TRIGGER audit_v2_accesses
  AFTER INSERT OR UPDATE OR DELETE ON v2.project_accesses
  FOR EACH ROW EXECUTE FUNCTION v2.audit_trigger_func();

-- Fonction RPC pour lire les accès déchiffrés
CREATE OR REPLACE FUNCTION v2.get_decrypted_accesses(p_project_id uuid)
RETURNS TABLE(
  id uuid,
  project_id uuid,
  category text,
  label text,
  url text,
  login text,
  password text,
  notes text,
  status text,
  provided_by text,
  expires_at date,
  created_at timestamptz,
  updated_at timestamptz
) AS $$
  SELECT
    a.id, a.project_id, a.category, a.label, a.url,
    CASE WHEN a.login IS NOT NULL THEN v2.decrypt_access(a.login) ELSE NULL END AS login,
    CASE WHEN a.password_encrypted IS NOT NULL THEN v2.decrypt_access(a.password_encrypted) ELSE NULL END AS password,
    CASE WHEN a.notes_encrypted IS NOT NULL THEN v2.decrypt_access(a.notes_encrypted) ELSE NULL END AS notes,
    a.status, a.provided_by, a.expires_at, a.created_at, a.updated_at
  FROM v2.project_accesses a
  WHERE a.project_id = p_project_id;
$$ LANGUAGE sql SECURITY DEFINER;

-- Fonction RPC pour insérer un accès chiffré
CREATE OR REPLACE FUNCTION v2.upsert_access(
  p_id uuid DEFAULT NULL,
  p_project_id uuid DEFAULT NULL,
  p_category text DEFAULT 'tools',
  p_label text DEFAULT '',
  p_url text DEFAULT NULL,
  p_login text DEFAULT NULL,
  p_password text DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_status text DEFAULT 'active',
  p_provided_by text DEFAULT NULL,
  p_expires_at date DEFAULT NULL
) RETURNS uuid AS $$
DECLARE
  v_id uuid;
BEGIN
  IF p_id IS NOT NULL THEN
    -- Update
    UPDATE v2.project_accesses SET
      category = p_category,
      label = p_label,
      url = p_url,
      login = CASE WHEN p_login IS NOT NULL THEN v2.encrypt_access(p_login) ELSE NULL END,
      password_encrypted = CASE WHEN p_password IS NOT NULL THEN v2.encrypt_access(p_password) ELSE NULL END,
      notes_encrypted = CASE WHEN p_notes IS NOT NULL THEN v2.encrypt_access(p_notes) ELSE NULL END,
      status = p_status,
      provided_by = p_provided_by,
      expires_at = p_expires_at
    WHERE id = p_id
    RETURNING id INTO v_id;
  ELSE
    -- Insert
    INSERT INTO v2.project_accesses (project_id, category, label, url, login, password_encrypted, notes_encrypted, status, provided_by, expires_at)
    VALUES (
      p_project_id, p_category, p_label, p_url,
      CASE WHEN p_login IS NOT NULL THEN v2.encrypt_access(p_login) ELSE NULL END,
      CASE WHEN p_password IS NOT NULL THEN v2.encrypt_access(p_password) ELSE NULL END,
      CASE WHEN p_notes IS NOT NULL THEN v2.encrypt_access(p_notes) ELSE NULL END,
      p_status, p_provided_by, p_expires_at
    )
    RETURNING id INTO v_id;
  END IF;
  RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
