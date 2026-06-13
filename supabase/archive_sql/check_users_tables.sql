-- Vérifier toutes les tables qui contiennent "user" ou "profile"
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND (table_name LIKE '%user%' OR table_name LIKE '%profile%')
ORDER BY table_name;

-- Vérifier la structure de chaque table trouvée
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_schema = 'public'
AND (table_name LIKE '%user%' OR table_name LIKE '%profile%')
ORDER BY table_name, ordinal_position;

-- Vérifier les données dans les tables qui existent
SELECT 'commercial_users' as table_name, COUNT(*) as count FROM commercial_users;
