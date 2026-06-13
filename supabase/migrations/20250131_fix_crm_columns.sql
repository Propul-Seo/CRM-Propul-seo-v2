-- Migration de correction pour crm_columns
-- Ajoute la colonne position si elle n'existe pas

-- Vérifier si la colonne position existe, sinon l'ajouter
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crm_columns' AND column_name = 'position'
    ) THEN
        ALTER TABLE crm_columns ADD COLUMN position INTEGER;
        
        -- Mettre à jour les positions existantes
        UPDATE crm_columns SET position = 1 WHERE id = 'prospect';
        UPDATE crm_columns SET position = 2 WHERE id = 'presentation_envoyee';
        UPDATE crm_columns SET position = 3 WHERE id = 'meeting_booke';
        UPDATE crm_columns SET position = 4 WHERE id = 'offre_envoyee';
        UPDATE crm_columns SET position = 5 WHERE id = 'en_attente';
        UPDATE crm_columns SET position = 6 WHERE id = 'signe';
        
        -- Rendre la colonne NOT NULL après avoir mis à jour les valeurs
        ALTER TABLE crm_columns ALTER COLUMN position SET NOT NULL;
    END IF;
END $$;

-- Vérifier si la colonne is_active existe, sinon l'ajouter
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crm_columns' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE crm_columns ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Vérifier si la colonne created_at existe, sinon l'ajouter
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crm_columns' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE crm_columns ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Vérifier si la colonne updated_at existe, sinon l'ajouter
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crm_columns' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE crm_columns ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- Créer les index s'ils n'existent pas
CREATE INDEX IF NOT EXISTS idx_crm_columns_active ON crm_columns(is_active);
CREATE INDEX IF NOT EXISTS idx_crm_columns_position ON crm_columns(position);

-- Créer ou remplacer la fonction trigger
CREATE OR REPLACE FUNCTION update_crm_columns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Créer le trigger s'il n'existe pas
DROP TRIGGER IF EXISTS trigger_update_crm_columns_updated_at ON crm_columns;
CREATE TRIGGER trigger_update_crm_columns_updated_at
  BEFORE UPDATE ON crm_columns
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_columns_updated_at();

-- Insérer les colonnes par défaut si elles n'existent pas
INSERT INTO crm_columns (id, title, color, header_color, position, is_active) VALUES
  ('prospect', 'Prospects', 'bg-blue-50 border-blue-200', 'bg-blue-500', 1, true),
  ('presentation_envoyee', 'Présentation Envoyée', 'bg-purple-50 border-purple-200', 'bg-purple-500', 2, true),
  ('meeting_booke', 'Meeting Booké', 'bg-orange-50 border-orange-200', 'bg-orange-500', 3, true),
  ('offre_envoyee', 'Offre Envoyée', 'bg-yellow-50 border-yellow-200', 'bg-yellow-500', 4, true),
  ('en_attente', 'En Attente', 'bg-gray-50 border-gray-200', 'bg-gray-500', 5, true),
  ('signe', 'Signés', 'bg-green-50 border-green-200', 'bg-green-500', 6, true)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  color = EXCLUDED.color,
  header_color = EXCLUDED.header_color,
  position = EXCLUDED.position,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
