-- Script de diagnostic pour crm_columns
-- À exécuter pour identifier les problèmes de structure

-- 1. Vérifier si la table existe
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_columns') 
    THEN 'Table crm_columns existe' 
    ELSE 'Table crm_columns N''EXISTE PAS' 
  END as table_status;

-- 2. Si la table existe, vérifier sa structure
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_columns') THEN
        RAISE NOTICE 'Structure de la table crm_columns:';
        
        -- Lister toutes les colonnes existantes
        FOR col IN 
            SELECT column_name, data_type, is_nullable, column_default
            FROM information_schema.columns 
            WHERE table_name = 'crm_columns'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE 'Colonne: % - Type: % - Nullable: % - Default: %', 
                col.column_name, col.data_type, col.is_nullable, col.column_default;
        END LOOP;
    END IF;
END $$;

-- 3. Vérifier les contraintes
SELECT 
    constraint_name, 
    constraint_type, 
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'crm_columns';

-- 4. Vérifier les index
SELECT 
    indexname, 
    indexdef
FROM pg_indexes 
WHERE tablename = 'crm_columns';

-- 5. Vérifier les triggers
SELECT 
    trigger_name, 
    event_manipulation, 
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'crm_columns';

-- 6. Vérifier les données existantes (si la table existe)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_columns') THEN
        RAISE NOTICE 'Données existantes dans crm_columns:';
        
        -- Compter les enregistrements
        EXECUTE 'SELECT COUNT(*) as total_records FROM crm_columns';
        
        -- Lister les enregistrements
        EXECUTE 'SELECT * FROM crm_columns ORDER BY id';
    END IF;
END $$;

-- 7. Vérifier les permissions
SELECT 
    grantee, 
    privilege_type, 
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'crm_columns';
