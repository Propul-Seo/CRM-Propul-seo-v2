-- Vérifier le contenu des tables users et user_profiles
-- Pour trouver où est stocké le nom "Etienne"

-- 1. Vérifier le contenu de la table users
SELECT 
    'Table users' as source,
    id,
    name,
    email,
    auth_user_id,
    role,
    created_at
FROM users 
ORDER BY created_at DESC;

-- 2. Vérifier le contenu de la table user_profiles
SELECT 
    'Table user_profiles' as source,
    id,
    name,
    email,
    role,
    created_at
FROM user_profiles 
ORDER BY created_at DESC;

-- 3. Vérifier les utilisateurs dans auth.users
SELECT 
    'Auth users' as source,
    id,
    email,
    raw_user_meta_data,
    created_at
FROM auth.users 
ORDER BY created_at DESC;

-- 4. Rechercher spécifiquement "Etienne" dans toutes les tables
SELECT 
    'Recherche Etienne' as info,
    'users' as table_name,
    COUNT(*) as count
FROM users 
WHERE name ILIKE '%etienne%' OR name ILIKE '%étienne%'

UNION ALL

SELECT 
    'Recherche Etienne' as info,
    'user_profiles' as table_name,
    COUNT(*) as count
FROM user_profiles 
WHERE name ILIKE '%etienne%' OR name ILIKE '%étienne%'

UNION ALL

SELECT 
    'Recherche Etienne' as info,
    'auth.users' as table_name,
    COUNT(*) as count
FROM auth.users 
WHERE raw_user_meta_data::text ILIKE '%etienne%' OR raw_user_meta_data::text ILIKE '%étienne%';

-- 5. Vérifier la structure exacte de raw_user_meta_data
SELECT 
    'Structure raw_user_meta_data' as info,
    id,
    email,
    raw_user_meta_data,
    jsonb_typeof(raw_user_meta_data) as data_type
FROM auth.users 
LIMIT 3;

-- 6. Compter le total d'utilisateurs dans chaque table
SELECT 
    'Comptage total' as info,
    'users' as table_name,
    COUNT(*) as total
FROM users

UNION ALL

SELECT 
    'Comptage total' as info,
    'user_profiles' as table_name,
    COUNT(*) as total
FROM user_profiles

UNION ALL

SELECT 
    'Comptage total' as info,
    'auth.users' as table_name,
    COUNT(*) as total
FROM auth.users;
