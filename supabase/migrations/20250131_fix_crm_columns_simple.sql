-- Migration de correction simplifiée pour crm_columns
-- Évite tous les conflits et gère proprement le cas UUID

-- 1. Vérifier le type de la colonne id
DO $$
DECLARE
    id_type text;
BEGIN
    SELECT data_type INTO id_type 
    FROM information_schema.columns 
    WHERE table_name = 'crm_columns' AND column_name = 'id';
    
    RAISE NOTICE 'Type de la colonne id: %', id_type;
END $$;

-- 2. Ajouter les colonnes manquantes une par une
DO $$
BEGIN
    -- Position
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crm_columns' AND column_name = 'position'
    ) THEN
        ALTER TABLE crm_columns ADD COLUMN position INTEGER;
        RAISE NOTICE 'Colonne position ajoutée';
    END IF;
    
    -- Is_active
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crm_columns' AND column_name = 'is_active'
    ) THEN
        ALTER TABLE crm_columns ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Colonne is_active ajoutée';
    END IF;
    
    -- Created_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crm_columns' AND column_name = 'created_at'
    ) THEN
        ALTER TABLE crm_columns ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Colonne created_at ajoutée';
    END IF;
    
    -- Updated_at
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'crm_columns' AND column_name = 'updated_at'
    ) THEN
        ALTER TABLE crm_columns ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Colonne updated_at ajoutée';
    END IF;
END $$;

-- 3. Créer les index
CREATE INDEX IF NOT EXISTS idx_crm_columns_active ON crm_columns(is_active);
CREATE INDEX IF NOT EXISTS idx_crm_columns_position ON crm_columns(position);

-- 4. Créer la fonction trigger
CREATE OR REPLACE FUNCTION update_crm_columns_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Créer le trigger
DROP TRIGGER IF EXISTS trigger_update_crm_columns_updated_at ON crm_columns;
CREATE TRIGGER trigger_update_crm_columns_updated_at
  BEFORE UPDATE ON crm_columns
  FOR EACH ROW
  EXECUTE FUNCTION update_crm_columns_updated_at();

-- 6. Vérifier s'il y a déjà des données
DO $$
DECLARE
    record_count integer;
BEGIN
    SELECT COUNT(*) INTO record_count FROM crm_columns;
    
    IF record_count = 0 THEN
        RAISE NOTICE 'Table vide - insertion des colonnes par défaut';
        
        -- Insérer les colonnes par défaut
        INSERT INTO crm_columns (id, title, color, header_color, position, is_active) VALUES
          (gen_random_uuid(), 'Prospects', 'bg-blue-50 border-blue-200', 'bg-blue-500', 1, true),
          (gen_random_uuid(), 'Présentation Envoyée', 'bg-purple-50 border-purple-200', 'bg-purple-500', 2, true),
          (gen_random_uuid(), 'Meeting Booké', 'bg-orange-50 border-orange-200', 'bg-orange-500', 3, true),
          (gen_random_uuid(), 'Offre Envoyée', 'bg-yellow-50 border-yellow-200', 'bg-yellow-500', 4, true),
          (gen_random_uuid(), 'En Attente', 'bg-gray-50 border-gray-200', 'bg-gray-500', 5, true),
          (gen_random_uuid(), 'Signés', 'bg-green-50 border-green-200', 'bg-green-500', 6, true);
          
        RAISE NOTICE '6 colonnes par défaut insérées';
    ELSE
        RAISE NOTICE 'Table contient déjà % enregistrements', record_count;
        
        -- Mettre à jour les positions existantes si elles sont NULL
        UPDATE crm_columns SET position = 1 WHERE position IS NULL AND title = 'Prospects';
        UPDATE crm_columns SET position = 2 WHERE position IS NULL AND title = 'Présentation Envoyée';
        UPDATE crm_columns SET position = 3 WHERE position IS NULL AND title = 'Meeting Booké';
        UPDATE crm_columns SET position = 4 WHERE position IS NULL AND title = 'Offre Envoyée';
        UPDATE crm_columns SET position = 5 WHERE position IS NULL AND title = 'En Attente';
        UPDATE crm_columns SET position = 6 WHERE position IS NULL AND title = 'Signés';
        
        -- Mettre à jour is_active si NULL
        UPDATE crm_columns SET is_active = true WHERE is_active IS NULL;
        
        RAISE NOTICE 'Positions et états mis à jour pour les colonnes existantes';
    END IF;
END $$;

-- 7. Rendre position NOT NULL si possible
DO $$
BEGIN
    -- Vérifier qu'il n'y a pas de valeurs NULL
    IF NOT EXISTS (SELECT 1 FROM crm_columns WHERE position IS NULL) THEN
        ALTER TABLE crm_columns ALTER COLUMN position SET NOT NULL;
        RAISE NOTICE 'Colonne position rendue NOT NULL';
    ELSE
        RAISE NOTICE 'Colonne position contient des valeurs NULL - pas de contrainte NOT NULL';
    END IF;
END $$;

-- 8. Afficher le résultat final
SELECT 
    id, 
    title, 
    position, 
    is_active, 
    created_at 
FROM crm_columns 
ORDER BY COALESCE(position, 999), title;
