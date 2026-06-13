-- Vérifier la structure exacte de la table users
-- Pour comprendre comment elle est organisée

-- 1. Structure de la table users
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'users' 
ORDER BY ordinal_position;

-- 2. Contenu de la table users avec tous les champs
SELECT 
    id,
    name,
    email,
    auth_user_id,
    role,
    created_at,
    updated_at
FROM users 
ORDER BY created_at DESC;

-- 3. Vérifier la relation avec auth.users
SELECT 
    u.id as users_id,
    u.name,
    u.email as users_email,
    u.auth_user_id,
    u.role,
    au.email as auth_email,
    au.raw_user_meta_data
FROM users u
LEFT JOIN auth.users au ON u.auth_user_id = au.id
ORDER BY u.created_at DESC;

-- 4. Compter les utilisateurs par rôle
SELECT 
    role,
    COUNT(*) as count
FROM users 
GROUP BY role
ORDER BY count DESC;

-- 5. Vérifier les contraintes et index
SELECT 
    constraint_name,
    constraint_type,
    table_name
FROM information_schema.table_constraints 
WHERE table_name = 'users';

-- 6. Vérifier les triggers
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'users';
