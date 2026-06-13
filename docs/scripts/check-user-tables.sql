-- Vérifier quelle table contient les informations utilisateur
-- Pour résoudre le problème d'affichage "Utilisateur" au lieu de "Etienne"

-- 1. Vérifier toutes les tables qui pourraient contenir des infos utilisateur
SELECT 
    table_name,
    'Table potentielle' as info
FROM information_schema.tables 
WHERE table_name LIKE '%user%' 
   OR table_name LIKE '%profile%'
   OR table_name LIKE '%auth%'
ORDER BY table_name;

-- 2. Vérifier la table 'users' si elle existe
DO $$
DECLARE
    col RECORD;
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        RAISE NOTICE 'Table users existe - vérification de la structure:';
        
        -- Lister les colonnes
        FOR col IN 
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'users'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE 'Colonne: % - Type: % - Nullable: %', 
                col.column_name, col.data_type, col.is_nullable;
        END LOOP;
        
        -- Compter les enregistrements
        EXECUTE 'SELECT COUNT(*) as total_users FROM users';
        
        -- Voir quelques exemples
        EXECUTE 'SELECT id, name, email, auth_user_id FROM users LIMIT 3';
    ELSE
        RAISE NOTICE 'Table users N''EXISTE PAS';
    END IF;
END $$;

-- 3. Vérifier la table 'user_profiles' si elle existe
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') THEN
        RAISE NOTICE 'Table user_profiles existe - vérification de la structure:';
        
        -- Lister les colonnes
        FOR col IN 
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns 
            WHERE table_name = 'user_profiles'
            ORDER BY ordinal_position
        LOOP
            RAISE NOTICE 'Colonne: % - Type: % - Nullable: %', 
                col.column_name, col.data_type, col.is_nullable;
        END LOOP;
        
        -- Compter les enregistrements
        EXECUTE 'SELECT COUNT(*) as total_profiles FROM user_profiles';
        
        -- Voir quelques exemples
        EXECUTE 'SELECT id, name, email, role FROM user_profiles LIMIT 3';
    ELSE
        RAISE NOTICE 'Table user_profiles N''EXISTE PAS';
    END IF;
END $$;

-- 4. Vérifier les tables d'authentification Supabase
SELECT 
    'Tables auth' as info,
    schemaname,
    tablename
FROM pg_tables 
WHERE schemaname = 'auth'
ORDER BY tablename;

-- 5. Vérifier les utilisateurs dans auth.users
SELECT 
    'Auth users' as info,
    COUNT(*) as total_auth_users
FROM auth.users;

-- 6. Voir un exemple d'utilisateur auth
SELECT 
    id,
    email,
    raw_user_meta_data
FROM auth.users 
LIMIT 3;
