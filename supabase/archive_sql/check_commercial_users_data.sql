-- Vérifier la structure et les données de commercial_users
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'commercial_users' 
ORDER BY ordinal_position;

-- Vérifier les données existantes
SELECT id, full_name, name, email, role, is_active, created_at 
FROM commercial_users 
ORDER BY created_at DESC;

-- Vérifier s'il y a des utilisateurs avec is_active = true
SELECT COUNT(*) as active_users 
FROM commercial_users 
WHERE is_active = true;

