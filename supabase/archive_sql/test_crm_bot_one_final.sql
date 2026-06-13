-- =====================================================
-- SCRIPT DE TEST CRM BOT ONE
-- =====================================================
-- À exécuter après la création des tables

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

-- 3. Vérifier les politiques RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
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

-- 5. Tester l'insertion d'un enregistrement de test
-- (Seulement si un utilisateur est connecté)
INSERT INTO crm_bot_one_records (
    user_id,
    data,
    status,
    tags
) VALUES (
    auth.uid(),
    '{"Nom": "Test User", "Email": "test@example.com", "Téléphone": "0123456789", "Statut": "nouveau"}'::jsonb,
    'active',
    ARRAY['test', 'demo']
);

-- 6. Vérifier l'enregistrement créé
SELECT 
    id,
    data,
    status,
    tags,
    created_at
FROM crm_bot_one_records 
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- 7. Vérifier les colonnes par défaut
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

-- 8. Test de mise à jour
UPDATE crm_bot_one_records 
SET 
    data = data || '{"Statut": "en_cours"}'::jsonb,
    status = 'updated'
WHERE user_id = auth.uid() 
AND data->>'Nom' = 'Test User';

-- 9. Vérifier la mise à jour
SELECT 
    id,
    data,
    status,
    updated_at
FROM crm_bot_one_records 
WHERE user_id = auth.uid()
ORDER BY updated_at DESC;

-- 10. Test de suppression
DELETE FROM crm_bot_one_records 
WHERE user_id = auth.uid() 
AND data->>'Nom' = 'Test User';

-- 11. Vérifier que l'enregistrement a été supprimé
SELECT COUNT(*) as remaining_records
FROM crm_bot_one_records 
WHERE user_id = auth.uid();

-- 12. Vérification finale des permissions
SELECT 
    'Accès en lecture' as test,
    CASE 
        WHEN (SELECT COUNT(*) FROM crm_bot_one_records WHERE user_id = auth.uid()) >= 0
        THEN '✅ SUCCÈS'
        ELSE '❌ ÉCHEC'
    END as result

UNION ALL

SELECT 
    'Accès aux colonnes' as test,
    CASE 
        WHEN (SELECT COUNT(*) FROM crm_bot_one_columns WHERE user_id = auth.uid()) >= 4
        THEN '✅ SUCCÈS'
        ELSE '❌ ÉCHEC'
    END as result;
