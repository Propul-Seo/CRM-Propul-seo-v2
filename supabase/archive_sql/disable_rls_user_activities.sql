-- =====================================================
-- DÉSACTIVER RLS POUR LA TABLE USER_ACTIVITIES
-- =====================================================
-- Script pour désactiver Row Level Security et permettre l'accès libre

-- 1. Supprimer toutes les politiques RLS existantes
DROP POLICY IF EXISTS "Users can view their own activities" ON user_activities;
DROP POLICY IF EXISTS "Users can insert their own activities" ON user_activities;
DROP POLICY IF EXISTS "Users can update their own activities" ON user_activities;

-- 2. Désactiver RLS complètement
ALTER TABLE user_activities DISABLE ROW LEVEL SECURITY;

-- 3. Donner toutes les permissions à tous les rôles
GRANT ALL ON user_activities TO anon;
GRANT ALL ON user_activities TO authenticated;
GRANT ALL ON user_activities TO service_role;

-- 4. Vérifier que RLS est désactivé
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE tablename = 'user_activities';

-- 5. Tester l'accès
SELECT 'RLS désactivé avec succès pour user_activities' as status;
