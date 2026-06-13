-- Vérifier que la table message_reactions existe et fonctionne
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier la structure de la table
SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'message_reactions' 
ORDER BY ordinal_position;

-- 2. Vérifier les politiques RLS
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'message_reactions';

-- 3. Vérifier les permissions
SELECT 
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'message_reactions';

-- 4. Vérifier que la table est vide (normal au début)
SELECT COUNT(*) as total_reactions FROM message_reactions;
