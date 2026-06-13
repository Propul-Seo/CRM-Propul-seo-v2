-- Vérifier la structure de la table
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'commercial_users' 
ORDER BY ordinal_position;

-- Vérifier les données existantes
SELECT * FROM commercial_users ORDER BY created_at DESC;

-- Mettre à jour les utilisateurs pour qu'ils soient actifs
UPDATE commercial_users 
SET is_active = true 
WHERE is_active IS NULL OR is_active = false;

-- Vérifier le résultat
SELECT * FROM commercial_users ORDER BY created_at DESC;