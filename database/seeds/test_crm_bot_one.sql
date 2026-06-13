-- Script de test pour CRM Bot One
-- Ce script teste les fonctionnalités de base de la page CRM Bot One

-- 1. Vérifier que les tables existent
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('crm_bot_one_records', 'crm_bot_one_columns')
ORDER BY table_name;

-- 2. Vérifier la structure des tables
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'crm_bot_one_records'
ORDER BY ordinal_position;

SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'crm_bot_one_columns'
ORDER BY ordinal_position;

-- 3. Vérifier les politiques RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies 
WHERE tablename IN ('crm_bot_one_records', 'crm_bot_one_columns')
ORDER BY tablename, policyname;

-- 4. Vérifier les index
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE tablename IN ('crm_bot_one_records', 'crm_bot_one_columns')
ORDER BY tablename, indexname;

-- 5. Tester l'insertion d'une colonne par défaut (simulation)
-- Note: Cette requête ne fonctionnera que si un utilisateur est connecté
INSERT INTO crm_bot_one_columns (
    user_id, 
    column_name, 
    column_type, 
    column_order, 
    is_required, 
    is_default, 
    default_value
) VALUES (
    auth.uid(),
    'Test Column',
    'text',
    1,
    false,
    true,
    'Valeur par défaut'
) ON CONFLICT (user_id, column_name) DO NOTHING;

-- 6. Vérifier les colonnes créées
SELECT 
    column_name,
    column_type,
    column_order,
    is_required,
    is_default,
    default_value
FROM crm_bot_one_columns 
WHERE user_id = auth.uid()
ORDER BY column_order;

-- 7. Tester l'insertion d'un enregistrement de test
INSERT INTO crm_bot_one_records (
    user_id,
    data,
    status,
    tags
) VALUES (
    auth.uid(),
    '{"Test Column": "Valeur de test", "Email": "test@example.com"}'::jsonb,
    'active',
    ARRAY['test', 'demo']
);

-- 8. Vérifier les enregistrements créés
SELECT 
    id,
    data,
    status,
    tags,
    created_at
FROM crm_bot_one_records 
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- 9. Test de mise à jour
UPDATE crm_bot_one_records 
SET 
    data = data || '{"Test Column": "Valeur mise à jour"}'::jsonb,
    status = 'updated'
WHERE user_id = auth.uid() 
AND data->>'Test Column' = 'Valeur de test';

-- 10. Vérifier la mise à jour
SELECT 
    id,
    data,
    status,
    updated_at
FROM crm_bot_one_records 
WHERE user_id = auth.uid()
ORDER BY updated_at DESC;

-- 11. Test de suppression
DELETE FROM crm_bot_one_records 
WHERE user_id = auth.uid() 
AND data->>'Test Column' = 'Valeur mise à jour';

-- 12. Vérifier que l'enregistrement a été supprimé
SELECT COUNT(*) as remaining_records
FROM crm_bot_one_records 
WHERE user_id = auth.uid();

-- 13. Nettoyer les données de test
DELETE FROM crm_bot_one_columns 
WHERE user_id = auth.uid() 
AND column_name = 'Test Column';

-- 14. Vérification finale
SELECT 
    'Tables créées' as test,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_bot_one_records')
        AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_bot_one_columns')
        THEN '✅ SUCCÈS'
        ELSE '❌ ÉCHEC'
    END as result

UNION ALL

SELECT 
    'Politiques RLS' as test,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'crm_bot_one_records') >= 4
        AND (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'crm_bot_one_columns') >= 4
        THEN '✅ SUCCÈS'
        ELSE '❌ ÉCHEC'
    END as result

UNION ALL

SELECT 
    'Index créés' as test,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'crm_bot_one_records') >= 2
        AND (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'crm_bot_one_columns') >= 2
        THEN '✅ SUCCÈS'
        ELSE '❌ ÉCHEC'
    END as result;
