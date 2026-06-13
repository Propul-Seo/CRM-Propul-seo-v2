-- Diagnostic simple des tables utilisateur
-- Sans boucles complexes pour éviter les erreurs de syntaxe

-- 1. Vérifier toutes les tables qui pourraient contenir des infos utilisateur
SELECT 
    table_name,
    'Table potentielle' as info
FROM information_schema.tables 
WHERE table_name LIKE '%user%' 
   OR table_name LIKE '%profile%'
   OR table_name LIKE '%auth%'
ORDER BY table_name;

-- 2. Vérifier si la table 'users' existe et sa structure
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
        THEN 'Table users existe' 
        ELSE 'Table users N''EXISTE PAS' 
    END as users_table_status;

-- 3. Si la table users existe, voir sa structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 4. Compter les utilisateurs dans la table users (si elle existe)
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
        THEN (SELECT COUNT(*) FROM users)
        ELSE 0 
    END as total_users;

-- 5. Vérifier si la table 'user_profiles' existe
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') 
        THEN 'Table user_profiles existe' 
        ELSE 'Table user_profiles N''EXISTE PAS' 
    END as user_profiles_status;

-- 6. Si user_profiles existe, voir sa structure
SELECT 
    column_name, 
    data_type, 
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 7. Vérifier les tables d'authentification Supabase
SELECT 
    'Tables auth' as info,
    schemaname,
    tablename
FROM pg_tables 
WHERE schemaname = 'auth'
ORDER BY tablename;

-- 8. Compter les utilisateurs dans auth.users
SELECT 
    'Auth users' as info,
    COUNT(*) as total_auth_users
FROM auth.users;

-- 9. Voir un exemple d'utilisateur auth
SELECT 
    id,
    email,
    raw_user_meta_data
FROM auth.users 
LIMIT 3;

-- 10. Vérifier les permissions sur les tables utilisateur
SELECT 
    grantee, 
    privilege_type, 
    table_name
FROM information_schema.role_table_grants 
WHERE table_name IN ('users', 'user_profiles')
ORDER BY table_name, privilege_type;
