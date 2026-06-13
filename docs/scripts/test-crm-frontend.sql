-- Test simple pour vérifier que crm_columns fonctionne
-- À exécuter pour confirmer que le frontend peut se connecter

-- 1. Vérifier la structure
SELECT 
    'Structure OK' as status,
    COUNT(*) as columns_count
FROM information_schema.columns 
WHERE table_name = 'crm_columns';

-- 2. Vérifier les données
SELECT 
    'Données OK' as status,
    COUNT(*) as rows_count,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_columns
FROM crm_columns;

-- 3. Vérifier les permissions (doit retourner des résultats)
SELECT 
    'Permissions OK' as status,
    grantee, 
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_name = 'crm_columns'
LIMIT 5;

-- 4. Test de lecture simple
SELECT 
    'Lecture OK' as status,
    id, 
    title, 
    position, 
    is_active
FROM crm_columns 
WHERE is_active = true 
ORDER BY position 
LIMIT 3;
