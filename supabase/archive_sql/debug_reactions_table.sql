-- Script de diagnostic pour la table message_reactions
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier la structure de la table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'message_reactions' 
ORDER BY ordinal_position;

-- 2. Vérifier les contraintes UNIQUE
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'message_reactions' 
  AND tc.constraint_type = 'UNIQUE';

-- 3. Voir les réactions actuelles pour l'utilisateur "team"
SELECT 
  mr.*,
  u.email as user_email,
  m.content as message_content
FROM message_reactions mr
JOIN users u ON mr.user_id = u.id
JOIN messages m ON mr.message_id = m.id
WHERE u.email = 'team@propulseo-site.com'
ORDER BY mr.created_at;

-- 4. Vérifier s'il y a des doublons
SELECT 
  message_id,
  user_id,
  emoji,
  COUNT(*) as count
FROM message_reactions
GROUP BY message_id, user_id, emoji
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 5. Vérifier les politiques RLS
SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'message_reactions';
