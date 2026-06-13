-- =====================================================
-- SCRIPT DE DIAGNOSTIC CRM BOT ONE
-- =====================================================
-- À exécuter dans le SQL Editor de Supabase

-- 1. Vérifier l'authentification
SELECT 
    'Authentification' as test,
    CASE 
        WHEN auth.uid() IS NOT NULL THEN '✅ Utilisateur connecté: ' || auth.email()
        ELSE '❌ Aucun utilisateur connecté'
    END as result;

-- 2. Vérifier l'existence des tables
SELECT 
    'Tables existantes' as test,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_bot_one_records')
        AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_bot_one_columns')
        THEN '✅ Tables créées'
        ELSE '❌ Tables manquantes'
    END as result;

-- 3. Vérifier les permissions RLS
SELECT 
    'Politiques RLS' as test,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'crm_bot_one_records') >= 4
        AND (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'crm_bot_one_columns') >= 4
        THEN '✅ Politiques RLS actives'
        ELSE '❌ Politiques RLS manquantes'
    END as result;

-- 4. Tester l'insertion directe d'une colonne (sans auth.uid())
INSERT INTO crm_bot_one_columns (
    user_id, 
    column_name, 
    column_type, 
    column_order, 
    is_required, 
    is_default, 
    default_value
) VALUES (
    '00000000-0000-0000-0000-000000000000'::uuid, -- UUID temporaire
    'Test Column',
    'text',
    1,
    false,
    true,
    'Test Value'
);

-- 5. Vérifier si l'insertion a fonctionné
SELECT 
    'Insertion test' as test,
    CASE 
        WHEN EXISTS (SELECT 1 FROM crm_bot_one_columns WHERE column_name = 'Test Column')
        THEN '✅ Insertion réussie'
        ELSE '❌ Échec insertion'
    END as result;

-- 6. Nettoyer l'insertion de test
DELETE FROM crm_bot_one_columns WHERE column_name = 'Test Column';

-- 7. Vérifier les utilisateurs dans auth.users
SELECT 
    'Utilisateurs auth' as test,
    COUNT(*) as user_count
FROM auth.users;

-- 8. Lister les utilisateurs (si possible)
SELECT 
    'Utilisateurs' as info,
    id,
    email,
    created_at
FROM auth.users
LIMIT 5;

-- 9. Tester avec un UUID d'utilisateur existant
WITH first_user AS (
    SELECT id FROM auth.users LIMIT 1
)
INSERT INTO crm_bot_one_columns (
    user_id, 
    column_name, 
    column_type, 
    column_order, 
    is_required, 
    is_default, 
    default_value
)
SELECT 
    id,
    'Test Column 2',
    'text',
    1,
    false,
    true,
    'Test Value 2'
FROM first_user;

-- 10. Vérifier cette insertion
SELECT 
    'Insertion avec UUID existant' as test,
    CASE 
        WHEN EXISTS (SELECT 1 FROM crm_bot_one_columns WHERE column_name = 'Test Column 2')
        THEN '✅ Insertion réussie'
        ELSE '❌ Échec insertion'
    END as result;

-- 11. Nettoyer
DELETE FROM crm_bot_one_columns WHERE column_name = 'Test Column 2';

-- 12. Vérifier les contraintes de la table
SELECT 
    'Contraintes table' as test,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'crm_bot_one_columns';

-- 13. Vérifier les colonnes de la table
SELECT 
    'Structure table' as test,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'crm_bot_one_columns'
ORDER BY ordinal_position;
