-- Script pour désactiver temporairement les RLS sur messages
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Vérifier l'état actuel des RLS
SELECT '=== ÉTAT ACTUEL RLS ===' as info;

SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'messages';

-- 2. Vérifier les politiques RLS existantes
SELECT '=== POLITIQUES RLS EXISTANTES ===' as info;

SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'messages';

-- 3. Désactiver RLS sur la table messages
SELECT '=== DÉSACTIVATION RLS ===' as info;

ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- 4. Vérifier que RLS est désactivé
SELECT '=== VÉRIFICATION RLS DÉSACTIVÉ ===' as info;

SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename = 'messages';

-- 5. Donner tous les droits aux utilisateurs authentifiés
SELECT '=== ATTRIBUTION DROITS ===' as info;

GRANT ALL ON messages TO authenticated;
GRANT ALL ON message_reactions TO authenticated;

-- 6. Message de confirmation
SELECT 'RLS désactivé sur messages - Test des réponses maintenant possible !' as status;
