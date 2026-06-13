-- =====================================================
-- CORRECTION DES PERMISSIONS ET AUTHENTIFICATION
-- =====================================================

-- 1. Vérifier l'utilisateur actuel
SELECT 
    'Utilisateur actuel' as info,
    auth.uid() as user_id,
    auth.email() as email;

-- 2. Vérifier les utilisateurs dans auth.users
SELECT 
    'Utilisateurs auth' as info,
    id,
    email,
    created_at
FROM auth.users
ORDER BY created_at DESC
LIMIT 5;

-- 3. Vérifier les politiques RLS
SELECT 
    'Politiques RLS' as info,
    tablename,
    policyname,
    cmd,
    permissive
FROM pg_policies 
WHERE tablename IN ('crm_bot_one_records', 'crm_bot_one_columns')
ORDER BY tablename, policyname;

-- 4. Vérifier les enregistrements existants
SELECT 
    'Enregistrements existants' as info,
    COUNT(*) as count
FROM crm_bot_one_records;

-- 5. Vérifier les colonnes existantes
SELECT 
    'Colonnes existantes' as info,
    COUNT(*) as count
FROM crm_bot_one_columns;

-- 6. Tester l'insertion avec l'utilisateur actuel
INSERT INTO crm_bot_one_records (user_id, data, status, tags)
VALUES (
    auth.uid(),
    '{"Nom entreprise": "Test Auth", "Nom contact": "Test User", "Email": "test@test.com", "Statut": "prospect"}'::jsonb,
    'prospect',
    ARRAY['test', 'auth']
);

-- 7. Vérifier l'insertion
SELECT 
    'Test insertion' as info,
    CASE 
        WHEN EXISTS (SELECT 1 FROM crm_bot_one_records WHERE data->>'Nom entreprise' = 'Test Auth')
        THEN '✅ Insertion réussie'
        ELSE '❌ Échec insertion'
    END as result;

-- 8. Nettoyer le test
DELETE FROM crm_bot_one_records WHERE data->>'Nom entreprise' = 'Test Auth';

-- 9. Vérifier les permissions sur les tables
SELECT 
    'Permissions tables' as info,
    table_name,
    privilege_type
FROM information_schema.table_privileges 
WHERE table_name IN ('crm_bot_one_records', 'crm_bot_one_columns')
AND grantee = 'authenticated';

-- 10. Test final de connectivité
SELECT 
    'Connectivité' as test,
    CASE 
        WHEN auth.uid() IS NOT NULL 
        AND EXISTS (SELECT 1 FROM crm_bot_one_columns LIMIT 1)
        THEN '✅ Connexion OK'
        ELSE '❌ Problème de connexion'
    END as result;
