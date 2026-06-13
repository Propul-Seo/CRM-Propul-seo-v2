-- Vérifier les permissions et la configuration Supabase
-- Pour diagnostiquer les erreurs 404 sur auth.users

-- 1. Vérifier les rôles et permissions actuels
SELECT 
    rolname as role_name,
    rolsuper as is_superuser,
    rolinherit as inherits_privileges
FROM pg_roles 
WHERE rolname IN ('authenticated', 'anon', 'service_role', 'postgres');

-- 2. Vérifier les permissions sur crm_columns
SELECT 
    grantee, 
    privilege_type, 
    is_grantable,
    table_name
FROM information_schema.role_table_grants 
WHERE table_name = 'crm_columns';

-- 3. Vérifier les permissions sur contacts
SELECT 
    grantee, 
    privilege_type, 
    is_grantable,
    table_name
FROM information_schema.role_table_grants 
WHERE table_name = 'contacts';

-- 4. Vérifier les politiques RLS (Row Level Security)
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
WHERE tablename IN ('crm_columns', 'contacts');

-- 5. Vérifier que l'utilisateur actuel peut lire crm_columns
SELECT 
    'Test lecture crm_columns' as test,
    COUNT(*) as result
FROM crm_columns 
WHERE is_active = true;

-- 6. Vérifier que l'utilisateur actuel peut lire contacts
SELECT 
    'Test lecture contacts' as test,
    COUNT(*) as result
FROM contacts 
LIMIT 1;

-- 7. Vérifier les fonctions disponibles
SELECT 
    proname as function_name,
    prosrc as source
FROM pg_proc 
WHERE proname LIKE '%crm%' OR proname LIKE '%contact%';
