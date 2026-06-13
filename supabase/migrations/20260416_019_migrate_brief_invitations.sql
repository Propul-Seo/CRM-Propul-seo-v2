-- Sprint 4 : Migration brief_invitations vers schéma v2
-- =====================================================

-- 1. Créer la table dans le schéma v2
CREATE TABLE IF NOT EXISTS v2.brief_invitations (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id    uuid REFERENCES v2.projects(id) ON DELETE CASCADE,
  token         text NOT NULL UNIQUE,
  company_name  text,
  status        text NOT NULL DEFAULT 'pending'
                CHECK (status IN ('pending', 'submitted', 'expired')),
  fields        jsonb,
  submitted_at  timestamptz,
  expires_at    timestamptz,
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- 2. Trigger updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON v2.brief_invitations
  FOR EACH ROW EXECUTE FUNCTION v2.set_updated_at();

-- 3. Index
CREATE INDEX idx_brief_invitations_token ON v2.brief_invitations(token);
CREATE INDEX idx_brief_invitations_project ON v2.brief_invitations(project_id);

-- 4. Migrer les données existantes
INSERT INTO v2.brief_invitations (id, project_id, token, company_name, status, fields, submitted_at, created_at)
SELECT
  id,
  project_id,
  token,
  company_name,
  status,
  fields,
  submitted_at,
  created_at
FROM public.brief_invitations
ON CONFLICT (id) DO NOTHING;

-- 5. Vue backward-compat
CREATE OR REPLACE VIEW public.brief_invitations AS
SELECT * FROM v2.brief_invitations;

-- 6. RLS
ALTER TABLE v2.brief_invitations ENABLE ROW LEVEL SECURITY;

-- Admin : accès total
CREATE POLICY admin_all ON v2.brief_invitations
  FOR ALL
  TO authenticated
  USING (public.is_admin());

-- Authenticated : lecture/écriture sur ses projets
CREATE POLICY team_access ON v2.brief_invitations
  FOR ALL
  TO authenticated
  USING (
    project_id IN (
      SELECT id FROM v2.projects
      WHERE assigned_to = auth.uid()
         OR created_by = auth.uid()
    )
  );

-- Anon : lecture par token uniquement (pour page publique)
CREATE POLICY anon_read_by_token ON v2.brief_invitations
  FOR SELECT
  TO anon
  USING (true);

-- Anon : update par token (soumission du brief)
CREATE POLICY anon_update_by_token ON v2.brief_invitations
  FOR UPDATE
  TO anon
  USING (true)
  WITH CHECK (true);
