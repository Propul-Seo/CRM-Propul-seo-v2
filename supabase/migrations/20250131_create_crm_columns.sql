-- Migration pour créer la table des colonnes CRM
-- Permet de persister la configuration des colonnes et leur état actif/inactif

CREATE TABLE IF NOT EXISTS crm_columns (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  color TEXT NOT NULL,
  header_color TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insérer les colonnes par défaut
INSERT INTO crm_columns (id, title, color, header_color, position) VALUES
  ('prospect', 'Prospects', 'bg-blue-50 border-blue-200', 'bg-blue-500', 1),
  ('presentation_envoyee', 'Présentation Envoyée', 'bg-purple-50 border-purple-200', 'bg-purple-500', 2),
  ('meeting_booke', 'Meeting Booké', 'bg-orange-50 border-orange-200', 'bg-orange-500', 3),
  ('offre_envoyee', 'Offre Envoyée', 'bg-yellow-50 border-yellow-200', 'bg-yellow-500', 4),
  ('en_attente', 'En Attente', 'bg-gray-50 border-gray-200', 'bg-gray-500', 5),
  ('signe', 'Signés', 'bg-green-50 border-green-200', 'bg-green-500', 6)
ON CONFLICT (id) DO NOTHING;

-- Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_crm_columns_active ON crm_columns(is_active);
CREATE INDEX IF NOT EXISTS idx_crm_columns_position ON crm_columns(position);

-- Trigger pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_crm_columns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_crm_columns_updated_at
  BEFORE UPDATE ON crm_columns
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_columns_updated_at();
