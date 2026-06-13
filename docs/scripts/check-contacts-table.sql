-- Vérifier que la table contacts existe et contient des données
-- Pour diagnostiquer les erreurs 404/400

-- 1. Vérifier si la table contacts existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts') 
        THEN 'Table contacts existe' 
        ELSE 'Table contacts N''EXISTE PAS' 
    END as contacts_table_status;

-- 2. Si la table existe, vérifier sa structure
DO $$
DECLARE
    col RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts') THEN
        RAISE NOTICE 'Structure de la table contacts:';
        
        FOR col IN 
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'contacts'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE 'Colonne: % - Type: % - Nullable: %', 
                col.column_name, col.data_type, col.is_nullable;
        END LOOP;
    END IF;
END $$;

-- 3. Compter les contacts
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts') 
        THEN (SELECT COUNT(*) FROM contacts)
        ELSE 0 
    END as total_contacts;

-- 4. Vérifier les statuts des contacts
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts') 
        THEN 'Statuts des contacts:'
        ELSE 'Table contacts inexistante'
    END as info;

-- 5. Lister les statuts si la table existe
DO $$
DECLARE
    stat RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts') THEN
        RAISE NOTICE 'Statuts des contacts:';
        
        FOR stat IN 
            SELECT DISTINCT status, COUNT(*) as count
            FROM contacts 
            GROUP BY status 
            ORDER BY count DESC
        LOOP
            RAISE NOTICE 'Statut: % - Nombre: %', stat.status, stat.count;
        END LOOP;
    END IF;
END $$;
