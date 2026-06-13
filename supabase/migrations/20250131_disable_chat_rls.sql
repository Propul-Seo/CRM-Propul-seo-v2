-- Migration pour désactiver temporairement les RLS sur les tables de chat
-- Date: 2025-01-31

-- =====================================================
-- DÉSACTIVATION DES RLS POUR LE CHAT
-- =====================================================

-- 1. Désactiver RLS sur la table channels
ALTER TABLE channels DISABLE ROW LEVEL SECURITY;

-- 2. Désactiver RLS sur la table messages
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- 3. Supprimer toutes les politiques RLS existantes
DROP POLICY IF EXISTS "Contrôle d'accès aux canaux" ON channels;
DROP POLICY IF EXISTS "Contrôle d'accès aux messages" ON messages;
DROP POLICY IF EXISTS "Canaux visibles par tous" ON channels;
DROP POLICY IF EXISTS "Messages visibles par tous" ON messages;
DROP POLICY IF EXISTS "Création de canaux par utilisateurs connectés" ON channels;
DROP POLICY IF EXISTS "Envoi de messages par utilisateurs connectés" ON messages;
DROP POLICY IF EXISTS "Modification de canaux par créateur" ON channels;
DROP POLICY IF EXISTS "Modification de messages par auteur" ON messages;
DROP POLICY IF EXISTS "Suppression de canaux par créateur" ON channels;
DROP POLICY IF EXISTS "Suppression de messages par auteur" ON messages;

-- 4. Donner tous les droits aux utilisateurs authentifiés
GRANT ALL ON channels TO authenticated;
GRANT ALL ON messages TO authenticated;

-- 5. Vérifier que les tables sont accessibles
-- Cette requête devrait maintenant fonctionner sans restriction
SELECT 
  'RLS désactivé sur channels' as status,
  COUNT(*) as total_channels
FROM channels;

SELECT 
  'RLS désactivé sur messages' as status,
  COUNT(*) as total_messages
FROM messages;
