-- Script de test pour crm_columns avec UUIDs
-- À exécuter après avoir appliqué la migration de correction UUID

-- 1. Vérifier la structure finale
SELECT 
    column_name, 
    data_type, 
    is_nullable, 
    column_default
FROM information_schema.columns 
WHERE table_name = 'crm_columns'
ORDER BY ordinal_position;

-- 2. Vérifier les données insérées
SELECT 
    id, 
    title, 
    position, 
    is_active, 
    created_at 
FROM crm_columns 
ORDER BY position;

-- 3. Tester l'ajout d'une nouvelle colonne
INSERT INTO crm_columns (id, title, color, header_color, position, is_active) VALUES
(gen_random_uuid(), 'Colonne de Test UUID', 'bg-pink-50 border-pink-200', 'bg-pink-500', 7, true);

-- 4. Vérifier l'insertion
SELECT 
    id, 
    title, 
    position, 
    is_active 
FROM crm_columns 
WHERE title = 'Colonne de Test UUID';

-- 5. Tester la désactivation
UPDATE crm_columns 
SET is_active = false 
WHERE title = 'Colonne de Test UUID';

-- 6. Vérifier que la colonne n'apparaît plus dans les colonnes actives
SELECT 
    id, 
    title, 
    position, 
    is_active 
FROM crm_columns 
WHERE is_active = true 
ORDER BY position;

-- 7. Tester la réactivation
UPDATE crm_columns 
SET is_active = true 
WHERE title = 'Colonne de Test UUID';

-- 8. Nettoyer les données de test
DELETE FROM crm_columns 
WHERE title = 'Colonne de Test UUID';

-- 9. Vérifier l'état final
SELECT 
    id, 
    title, 
    position, 
    is_active 
FROM crm_columns 
WHERE is_active = true 
ORDER BY position;

-- 10. Vérifier les contraintes et index
SELECT 
    constraint_name, 
    constraint_type 
FROM information_schema.table_constraints 
WHERE table_name = 'crm_columns';

SELECT 
    indexname 
FROM pg_indexes 
WHERE tablename = 'crm_columns';

-- 11. Vérifier les triggers
SELECT 
    trigger_name, 
    event_manipulation 
FROM information_schema.triggers 
WHERE event_object_table = 'crm_columns';
