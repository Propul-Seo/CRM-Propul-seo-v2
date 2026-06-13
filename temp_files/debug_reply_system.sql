-- Script de diagnostic pour le système de réponses
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier si la colonne reply_to_message_id existe
SELECT '=== VÉRIFICATION COLONNE REPLY ===' as info;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name = 'reply_to_message_id';

-- 2. Vérifier la structure de la table messages
SELECT '=== STRUCTURE TABLE MESSAGES ===' as info;

SELECT 
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'messages' 
ORDER BY ordinal_position;

-- 3. Vérifier les messages existants avec réponses
SELECT '=== MESSAGES AVEC RÉPONSES ===' as info;

SELECT 
  m.id,
  m.content,
  m.user_id,
  m.reply_to_message_id,
  m.created_at,
  u.email as sender_email
FROM messages m
LEFT JOIN users u ON m.user_id = u.id
WHERE m.reply_to_message_id IS NOT NULL
ORDER BY m.created_at DESC;

-- 4. Vérifier la fonction get_reply_message_info
SELECT '=== FONCTION REPLY INFO ===' as info;

SELECT 
  routine_name,
  routine_type,
  data_type
FROM information_schema.routines 
WHERE routine_name = 'get_reply_message_info';

-- 5. Tester la fonction avec un message existant
SELECT '=== TEST FONCTION REPLY ===' as info;

-- Récupérer un message existant pour tester
SELECT 
  'Test avec message ID:' as test_info,
  id as message_id,
  content as message_content
FROM messages 
LIMIT 1;

-- 6. Vérifier les permissions
SELECT '=== PERMISSIONS ===' as info;

SELECT 
  grantee,
  privilege_type,
  table_name
FROM information_schema.role_table_grants 
WHERE table_name = 'messages';

-- 7. Message de diagnostic
SELECT 'Diagnostic terminé - vérifier les résultats ci-dessus' as status;
