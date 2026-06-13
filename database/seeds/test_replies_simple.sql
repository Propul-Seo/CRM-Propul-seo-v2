-- Script de test simple pour le système de réponses
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier que RLS est désactivé
SELECT '=== VÉRIFICATION RLS ===' as info;

SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'messages';

-- 2. Vérifier les messages existants
SELECT '=== MESSAGES EXISTANTS ===' as info;

SELECT 
  id,
  content,
  user_id,
  channel_id,
  created_at
FROM messages 
ORDER BY created_at DESC 
LIMIT 5;

-- 3. Vérifier les utilisateurs
SELECT '=== UTILISATEURS ===' as info;

SELECT 
  id,
  name,
  email
FROM users 
LIMIT 5;

-- 4. Tester la fonction get_reply_message_info
SELECT '=== TEST FONCTION REPLY ===' as info;

-- Récupérer un message existant pour tester
WITH test_message AS (
  SELECT id FROM messages LIMIT 1
)
SELECT 
  'Message de test disponible avec ID:' as info,
  id as message_id
FROM test_message;

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
SELECT 'Système prêt pour les tests de réponses !' as status;
