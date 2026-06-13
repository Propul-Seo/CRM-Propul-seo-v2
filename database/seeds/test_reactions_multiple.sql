-- Script de test pour les réactions multiples avec le même emoji
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier la structure actuelle
SELECT '=== STRUCTURE ACTUELLE ===' as info;

SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'message_reactions' 
  AND tc.constraint_type = 'UNIQUE';

-- 2. Vérifier les réactions existantes
SELECT '=== RÉACTIONS EXISTANTES ===' as info;

SELECT 
  mr.*,
  u.email as user_email,
  m.content as message_content
FROM message_reactions mr
JOIN users u ON mr.user_id = u.id
JOIN messages m ON mr.message_id = m.id
ORDER BY mr.created_at DESC
LIMIT 10;

-- 3. Tester l'ajout de réactions multiples (simulation)
SELECT '=== TEST RÉACTIONS MULTIPLES ===' as info;

-- Vérifier si on peut avoir plusieurs utilisateurs avec le même emoji
SELECT 
  message_id,
  emoji,
  COUNT(*) as user_count,
  ARRAY_AGG(u.email) as users
FROM message_reactions mr
JOIN users u ON mr.user_id = u.id
GROUP BY message_id, emoji
HAVING COUNT(*) > 1
ORDER BY user_count DESC;

-- 4. Message de confirmation
SELECT 'Test des réactions multiples terminé !' as status;
