-- Script pour créer la table crm_columns si elle n'existe pas
-- et activer la synchronisation temps réel

-- Créer la table crm_columns
CREATE TABLE IF NOT EXISTS crm_columns (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  column_id VARCHAR(50) NOT NULL UNIQUE,
  title VARCHAR(255) NOT NULL,
  color VARCHAR(50) NOT NULL DEFAULT 'bg-gray-50',
  header_color VARCHAR(50) NOT NULL DEFAULT 'bg-gray-100',
  is_active BOOLEAN NOT NULL DEFAULT true,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Créer un index sur la position pour un tri rapide
CREATE INDEX IF NOT EXISTS idx_crm_columns_position ON crm_columns(position);
CREATE INDEX IF NOT EXISTS idx_crm_columns_active ON crm_columns(is_active);

-- Activer RLS (Row Level Security)
ALTER TABLE crm_columns ENABLE ROW LEVEL SECURITY;

-- Supprimer les politiques existantes si elles existent
DROP POLICY IF EXISTS "Allow authenticated users to read crm_columns" ON crm_columns;
DROP POLICY IF EXISTS "Allow authenticated users to modify crm_columns" ON crm_columns;

-- Créer une politique pour permettre à tous les utilisateurs authentifiés de lire les colonnes
CREATE POLICY "Allow authenticated users to read crm_columns" 
ON crm_columns FOR SELECT 
TO authenticated 
USING (true);

-- Créer une politique pour permettre à tous les utilisateurs authentifiés de modifier les colonnes
CREATE POLICY "Allow authenticated users to modify crm_columns" 
ON crm_columns FOR ALL 
TO authenticated 
USING (true);

-- Activer la synchronisation temps réel
ALTER PUBLICATION supabase_realtime ADD TABLE crm_columns;

-- Insérer des colonnes par défaut si la table est vide
INSERT INTO crm_columns (column_id, title, color, header_color, position) 
SELECT * FROM (VALUES 
  ('nouveaux', 'Nouveaux', 'bg-blue-50', 'bg-blue-100', 1),
  ('qualifies', 'Qualifiés', 'bg-green-50', 'bg-green-100', 2),
  ('en_negociation', 'En négociation', 'bg-orange-50', 'bg-orange-100', 3),
  ('prospects', 'Prospects', 'bg-purple-50', 'bg-purple-100', 4),
  ('clients', 'Clients', 'bg-emerald-50', 'bg-emerald-100', 5)
) AS default_columns(column_id, title, color, header_color, position)
WHERE NOT EXISTS (SELECT 1 FROM crm_columns);

-- Créer une fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Créer le trigger pour updated_at
DROP TRIGGER IF EXISTS update_crm_columns_updated_at ON crm_columns;
CREATE TRIGGER update_crm_columns_updated_at
    BEFORE UPDATE ON crm_columns
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Afficher les colonnes créées
SELECT 'Colonnes CRM créées avec succès:' as message;
SELECT id, title, color, header_color, position, is_active FROM crm_columns ORDER BY position;
