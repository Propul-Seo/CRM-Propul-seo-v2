-- =====================================================
-- DIAGNOSTIC DES TABLES COMMERCIALES
-- =====================================================

-- 1. Vérifier que les tables existent
SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'commercial_%'
ORDER BY table_name;

-- 2. Vérifier le contenu de commercial_users
SELECT COUNT(*) as total_users FROM commercial_users;
SELECT * FROM commercial_users LIMIT 5;

-- 3. Vérifier le contenu de commercial_points
SELECT COUNT(*) as total_points FROM commercial_points;
SELECT * FROM commercial_points LIMIT 5;

-- 4. Vérifier les contraintes de foreign key
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name,
  tc.constraint_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
  AND tc.table_schema = kcu.table_schema
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
  AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name LIKE 'commercial_%'
ORDER BY tc.table_name, kcu.column_name;

-- 5. Essayer de créer l'utilisateur étape par étape
-- D'abord vérifier si l'utilisateur existe déjà
SELECT 
  id,
  user_id,
  name,
  email,
  role
FROM commercial_users 
WHERE id = '470c709c-abce-48c8-b8b3-320cd98a5ed5'::UUID
OR user_id = '470c709c-abce-48c8-b8b3-320cd98a5ed5'::UUID;
