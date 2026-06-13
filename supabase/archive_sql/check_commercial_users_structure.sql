-- =====================================================
-- VÉRIFIER LA STRUCTURE DE LA TABLE COMMERCIAL_USERS
-- =====================================================

-- 1. Vérifier la structure de la table commercial_users
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'commercial_users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 2. Vérifier les contraintes de la table
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'commercial_users'
AND tc.table_schema = 'public';
