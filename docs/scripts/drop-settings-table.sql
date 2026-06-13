-- Script pour supprimer définitivement la table settings de Supabase
-- ATTENTION: Cette opération est irréversible !

-- 1. Vérifier d'abord ce qui est dans la table settings
SELECT 
    'Contenu de la table settings avant suppression:' as info;
    
SELECT 
    id,
    user_id,
    settings_data,
    created_at,
    updated_at
FROM settings
ORDER BY created_at DESC;

-- 2. Supprimer les triggers associés
DROP TRIGGER IF EXISTS update_settings_updated_at ON settings;

-- 3. Supprimer la fonction update_updated_at_column si elle n'est utilisée que par settings
-- (Vérifier d'abord si d'autres tables l'utilisent)
SELECT 
    trigger_name,
    event_object_table
FROM information_schema.triggers 
WHERE trigger_name = 'update_settings_updated_at';

-- Si seulement settings l'utilise, on peut la supprimer
-- DROP FUNCTION IF EXISTS update_updated_at_column();

-- 4. Supprimer les politiques RLS
DROP POLICY IF EXISTS "users_can_manage_own_settings" ON settings;

-- 5. Désactiver RLS
ALTER TABLE settings DISABLE ROW LEVEL SECURITY;

-- 6. Supprimer les contraintes
ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_user_id_fkey;
ALTER TABLE settings DROP CONSTRAINT IF EXISTS settings_user_id_key;

-- 7. Supprimer les index
DROP INDEX IF EXISTS idx_settings_user_id;

-- 8. Supprimer définitivement la table settings
DROP TABLE IF EXISTS settings CASCADE;

-- 9. Vérifier que la table a bien été supprimée
SELECT 
    'Vérification de la suppression:' as info;
    
SELECT 
    table_name
FROM information_schema.tables 
WHERE table_name = 'settings';

-- 10. Vérifier que la table users est bien là et fonctionnelle
SELECT 
    'Vérification de la table users:' as info;
    
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

-- 11. Vérifier les politiques RLS sur users (si elles existent)
SELECT 
    'Politiques RLS sur users:' as info;
    
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
WHERE tablename = 'users';

-- 12. Message de confirmation
SELECT 
    '✅ Table settings supprimée avec succès !' as confirmation,
    'La table users est maintenant la référence unique pour les paramètres utilisateur.' as info;
