-- =====================================================
-- AJOUT DE LA PERMISSION COMMERCIAL
-- =====================================================
-- Script pour ajouter la permission de voir le dashboard commercial

-- Ajouter la permission can_view_commercial aux utilisateurs existants
UPDATE auth.users 
SET raw_user_meta_data = COALESCE(raw_user_meta_data, '{}'::jsonb) || 
    '{"permissions": ["can_view_dashboard", "can_view_leads", "can_view_projects", "can_view_tasks", "can_view_chat", "can_view_commercial"]}'::jsonb
WHERE raw_user_meta_data IS NULL 
   OR NOT (raw_user_meta_data ? 'permissions');

-- Ou si les permissions sont stockées différemment, ajuster selon votre structure
-- Exemple pour une table user_profiles séparée :
-- UPDATE user_profiles 
-- SET permissions = permissions || ARRAY['can_view_commercial']
-- WHERE permissions IS NOT NULL;

-- Vérifier que la permission a été ajoutée
SELECT 
    id,
    email,
    raw_user_meta_data->'permissions' as permissions
FROM auth.users 
WHERE raw_user_meta_data ? 'permissions';
