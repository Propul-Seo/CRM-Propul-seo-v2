-- Migration de correction pour crm_columns avec UUID
-- Gère le cas où l'id est de type UUID au lieu de TEXT

-- 1. Vérifier le type de la colonne id
DO $$
DECLARE
    id_type text;
BEGIN
    SELECT data_type INTO id_type 
    FROM information_schema.columns 
    WHERE table_name = 'crm_columns' AND column_name = 'id';
    
    RAISE NOTICE 'Type de la colonne id: %', id_type;
    
    -- Si l'id est UUID, on doit adapter la stratégie
    IF id_type = 'uuid' THEN
        RAISE NOTICE 'La colonne id est de type UUID - adaptation nécessaire';
    END IF;
END $$;

-- 2. Vérifier si la colonne position existe, sinon l'ajouter
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crm_columns' AND column_name = 'position'
    ) THEN
        ALTER TABLE crm_columns ADD COLUMN position INTEGER;
        RAISE NOTICE 'Colonne position ajoutée';
    END IF;
END $$;

-- 3. Vérifier si la colonne is_active existe, sinon l'ajouter
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crm_columns' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE crm_columns ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Colonne is_active ajoutée';
    END IF;
END $$;

-- 4. Vérifier si la colonne created_at existe, sinon l'ajouter
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crm_columns' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE crm_columns ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Colonne created_at ajoutée';
    END IF;
END $$;

-- 5. Vérifier si la colonne updated_at existe, sinon l'ajouter
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crm_columns' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE crm_columns ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Colonne updated_at ajoutée';
    END IF;
END $$;

-- 6. Créer les index s'ils n'existent pas
CREATE INDEX IF NOT EXISTS idx_crm_columns_active ON crm_columns(is_active);
CREATE INDEX IF NOT EXISTS idx_crm_columns_position ON crm_columns(position);

-- 7. Créer ou remplacer la fonction trigger
CREATE OR REPLACE FUNCTION update_crm_columns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 8. Créer le trigger s'il n'existe pas
DROP TRIGGER IF EXISTS trigger_update_crm_columns_updated_at ON crm_columns;
CREATE TRIGGER trigger_update_crm_columns_updated_at
  BEFORE UPDATE ON crm_columns
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_columns_updated_at();

-- 9. Insérer les colonnes par défaut avec des UUIDs
-- D'abord, supprimer les anciennes données si elles existent (par titre)
DELETE FROM crm_columns WHERE title IN (
    'Prospects', 'Présentation Envoyée', 'Meeting Booké', 
    'Offre Envoyée', 'En Attente', 'Signés'
);

-- Insérer avec de nouveaux UUIDs
INSERT INTO crm_columns (id, title, color, header_color, position, is_active) VALUES
  (gen_random_uuid(), 'Prospects', 'bg-blue-50 border-blue-200', 'bg-blue-500', 1, true),
  (gen_random_uuid(), 'Présentation Envoyée', 'bg-purple-50 border-purple-200', 'bg-purple-500', 2, true),
  (gen_random_uuid(), 'Meeting Booké', 'bg-orange-50 border-orange-200', 'bg-orange-500', 3, true),
  (gen_random_uuid(), 'Offre Envoyée', 'bg-yellow-50 border-yellow-200', 'bg-yellow-500', 4, true),
  (gen_random_uuid(), 'En Attente', 'bg-gray-50 border-gray-200', 'bg-gray-500', 5, true),
  (gen_random_uuid(), 'Signés', 'bg-green-50 border-green-200', 'bg-green-500', 6, true);

-- 10. Mettre à jour les positions pour qu'elles soient NOT NULL
DO $$
BEGIN
    -- Mettre à jour les positions existantes
    UPDATE crm_columns SET position = 1 WHERE position IS NULL AND title = 'Prospects';
    UPDATE crm_columns SET position = 2 WHERE position IS NULL AND title = 'Présentation Envoyée';
    UPDATE crm_columns SET position = 3 WHERE position IS NULL AND title = 'Meeting Booké';
    UPDATE crm_columns SET position = 4 WHERE position IS NULL AND title = 'Offre Envoyée';
    UPDATE crm_columns SET position = 5 WHERE position IS NULL AND title = 'En Attente';
    UPDATE crm_columns SET position = 6 WHERE position IS NULL AND title = 'Signés';
    
    -- Rendre la colonne NOT NULL après avoir mis à jour les valeurs
    ALTER TABLE crm_columns ALTER COLUMN position SET NOT NULL;
    RAISE NOTICE 'Colonne position rendue NOT NULL';
END $$;

-- 11. Afficher le résultat final
SELECT 
    id, 
    title, 
    position, 
    is_active, 
    created_at 
FROM crm_columns 
ORDER BY position;
