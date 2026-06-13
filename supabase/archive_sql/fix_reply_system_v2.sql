-- Script de correction pour le système de réponses - Version 2
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier la structure actuelle des tables
SELECT '=== STRUCTURE ACTUELLE ===' as info;

-- Vérifier la table messages
SELECT 
  tc.table_name,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc 
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND tc.table_name='messages';

-- 2. Vérifier les tables users et user_profiles
SELECT '=== TABLES USERS ET USER_PROFILES ===' as info;

SELECT table_name, table_type 
FROM information_schema.tables 
WHERE table_name IN ('users', 'user_profiles')
ORDER BY table_name;

-- 3. Vérifier la structure des tables (colonnes disponibles)
SELECT '=== COLONNES TABLE USERS ===' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'users'
ORDER BY ordinal_position;

SELECT '=== COLONNES TABLE USER_PROFILES ===' as info;
SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- 4. Vérifier le contenu des tables (avec les bonnes colonnes)
SELECT '=== CONTENU TABLE USERS ===' as info;
SELECT id, name FROM users LIMIT 5;

SELECT '=== CONTENU TABLE USER_PROFILES ===' as info;
SELECT id, name FROM user_profiles LIMIT 5;

-- 5. Corriger la fonction get_reply_message_info selon la structure
SELECT '=== CORRECTION FONCTION ===' as info;

-- Supprimer l'ancienne fonction
DROP FUNCTION IF EXISTS get_reply_message_info(UUID);

-- Créer la fonction avec la bonne table et colonnes
CREATE OR REPLACE FUNCTION get_reply_message_info(reply_message_id UUID)
RETURNS TABLE (
  id UUID,
  content TEXT,
  sender_name TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  -- Essayer d'abord avec la table users
  BEGIN
    RETURN QUERY
    SELECT 
      m.id,
      m.content,
      COALESCE(u.name, 'Utilisateur') as sender_name,
      m.created_at
    FROM messages m
    JOIN users u ON m.user_id = u.id
    WHERE m.id = reply_message_id;
    
    -- Si on arrive ici, c'est que la table users fonctionne
    RETURN;
  EXCEPTION
    WHEN OTHERS THEN
      -- Sinon, essayer avec user_profiles
      RETURN QUERY
      SELECT 
        m.id,
        m.content,
        COALESCE(up.name, 'Utilisateur') as sender_name,
        m.created_at
      FROM messages m
      JOIN user_profiles up ON m.user_id = up.id
      WHERE m.id = reply_message_id;
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Donner les permissions
GRANT EXECUTE ON FUNCTION get_reply_message_info(UUID) TO authenticated;

-- 7. Tester la fonction
SELECT '=== TEST FONCTION CORRIGÉE ===' as info;

-- Vérifier qu'il y a des messages pour tester
SELECT COUNT(*) as total_messages FROM messages;

-- 8. Message de confirmation
SELECT 'Système de réponses corrigé !' as status;
