-- Script de test pour vérifier que la colonne assigned_to fonctionne
-- Exécute ce script dans Supabase pour diagnostiquer le problème

-- 1. Vérifier que la colonne assigned_to existe
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'contacts' 
AND column_name = 'assigned_to';

-- 2. Vérifier les contraintes de clé étrangère
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'contacts'
AND kcu.column_name = 'assigned_to';

-- 3. Vérifier les politiques RLS
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'contacts';

-- 4. Voir la structure actuelle de la table contacts
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'contacts'
ORDER BY ordinal_position;

-- 5. Voir quelques contacts existants avec leurs assigned_to
SELECT 
    id,
    name,
    company,
    assigned_to,
    status,
    created_at
FROM contacts 
LIMIT 5;

-- 6. Voir les utilisateurs disponibles
SELECT 
    id,
    email,
    raw_user_meta_data
FROM auth.users
LIMIT 5;

-- 7. Tester une requête SELECT avec la jointure users
SELECT 
    c.id,
    c.name,
    c.company,
    c.assigned_to,
    u.email as assigned_user_email
FROM contacts c
LEFT JOIN auth.users u ON c.assigned_to = u.id
LIMIT 5;

-- 8. Vérifier les permissions de l'utilisateur connecté
SELECT 
    current_user,
    session_user;

-- 9. Vérifier s'il y a des erreurs dans les contraintes
SELECT 
    conname,
    contype,
    pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'contacts'::regclass;

-- 10. Vérifier si la table contacts a des triggers
SELECT 
    trigger_name,
    event_manipulation,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'contacts';

-- 11. Vérifier les permissions sur la table contacts
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'contacts';
