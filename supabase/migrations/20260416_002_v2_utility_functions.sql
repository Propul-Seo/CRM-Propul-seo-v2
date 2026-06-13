-- ============================================================
-- Migration 002 : Fonctions utilitaires du schéma v2
-- ============================================================

-- 1. Trigger auto-update du champ updated_at
CREATE OR REPLACE FUNCTION v2.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Chiffrement pgcrypto pour le coffre-fort accès
-- La clé est stockée dans une variable PostgreSQL sécurisée
-- À configurer via : ALTER DATABASE postgres SET app.encryption_key = 'votre-clé-secrète';

CREATE OR REPLACE FUNCTION v2.encrypt_access(plain_text text)
RETURNS bytea AS $$
BEGIN
  RETURN pgp_sym_encrypt(plain_text, current_setting('app.encryption_key'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION v2.decrypt_access(encrypted bytea)
RETURNS text AS $$
BEGIN
  RETURN pgp_sym_decrypt(encrypted, current_setting('app.encryption_key'));
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Table audit_logs (créée ici car le trigger en dépend)
CREATE TABLE IF NOT EXISTS v2.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES public.users(id),
  project_id uuid,
  table_name text NOT NULL,
  record_id uuid NOT NULL,
  action text NOT NULL CHECK (action IN ('insert', 'update', 'delete')),
  old_data jsonb,
  new_data jsonb,
  ip_address inet,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX idx_audit_logs_table_record ON v2.audit_logs(table_name, record_id);
CREATE INDEX idx_audit_logs_project ON v2.audit_logs(project_id);
CREATE INDEX idx_audit_logs_created ON v2.audit_logs(created_at DESC);

ALTER TABLE v2.audit_logs ENABLE ROW LEVEL SECURITY;

-- Lecture seule pour les utilisateurs authentifiés
CREATE POLICY "Authenticated read audit_logs"
  ON v2.audit_logs FOR SELECT TO authenticated
  USING (true);

-- Pas de policy INSERT/UPDATE/DELETE pour authenticated :
-- seul le trigger (SECURITY DEFINER) peut écrire

-- 4. Trigger d'audit automatique (appliqué aux tables via les migrations suivantes)
CREATE OR REPLACE FUNCTION v2.audit_trigger_func()
RETURNS trigger AS $$
DECLARE
  v_project_id uuid;
BEGIN
  -- Essayer d'extraire project_id de la ligne (si la colonne existe)
  BEGIN
    IF TG_OP = 'DELETE' THEN
      v_project_id := OLD.project_id;
    ELSE
      v_project_id := NEW.project_id;
    END IF;
  EXCEPTION WHEN undefined_column THEN
    -- La table n'a pas de colonne project_id (ex: feature_templates)
    v_project_id := NULL;
  END;

  IF TG_OP = 'DELETE' THEN
    INSERT INTO v2.audit_logs (user_id, project_id, table_name, record_id, action, old_data)
    VALUES (auth.uid(), v_project_id, TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME, OLD.id, 'delete', to_jsonb(OLD));
    RETURN OLD;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO v2.audit_logs (user_id, project_id, table_name, record_id, action, old_data, new_data)
    VALUES (auth.uid(), v_project_id, TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME, OLD.id, 'update', to_jsonb(OLD), to_jsonb(NEW));
    RETURN NEW;
  ELSIF TG_OP = 'INSERT' THEN
    INSERT INTO v2.audit_logs (user_id, project_id, table_name, record_id, action, new_data)
    VALUES (auth.uid(), v_project_id, TG_TABLE_SCHEMA || '.' || TG_TABLE_NAME, NEW.id, 'insert', to_jsonb(NEW));
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
