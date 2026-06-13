-- Script de test pour vérifier les réponses en base
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier l'état des RLS
SELECT '=== ÉTAT RLS ===' as info;

SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'messages';

-- 2. Vérifier les messages avec réponses
SELECT '=== MESSAGES AVEC RÉPONSES ===' as info;

SELECT 
  m.id,
  m.content,
  m.user_id,
  m.reply_to_message_id,
  m.created_at,
  rm.content as original_message_content,
  u.name as sender_name
FROM messages m
LEFT JOIN messages rm ON m.reply_to_message_id = rm.id
LEFT JOIN users u ON m.user_id = u.id
WHERE m.reply_to_message_id IS NOT NULL
ORDER BY m.created_at DESC;

-- 3. Vérifier tous les messages récents
SELECT '=== TOUS LES MESSAGES RÉCENTS ===' as info;

SELECT 
  id,
  content,
  user_id,
  reply_to_message_id,
  created_at
FROM messages 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. Tester la fonction get_reply_message_info
SELECT '=== TEST FONCTION REPLY INFO ===' as info;

-- Utiliser la fonction avec un message qui a une réponse
SELECT * FROM get_reply_message_info(
  (SELECT reply_to_message_id FROM messages WHERE reply_to_message_id IS NOT NULL LIMIT 1)
);

-- 5. Vérifier les permissions
SELECT '=== PERMISSIONS ===' as info;

SELECT 
  grantee,
  privilege_type,
  table_name
FROM information_schema.role_table_grants 
WHERE table_name = 'messages'
AND grantee = 'authenticated';

-- 6. Message de test
SELECT 'Vérification des réponses terminée !' as status;
