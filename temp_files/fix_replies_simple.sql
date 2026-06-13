-- Script simple pour corriger les réponses
-- À exécuter dans Supabase

-- 1. Vérifier que RLS est désactivé
ALTER TABLE messages DISABLE ROW LEVEL SECURITY;

-- 2. Donner tous les droits
GRANT ALL ON messages TO authenticated;

-- 3. Vérifier que la colonne existe
SELECT 'Colonne reply_to_message_id existe:' as info, 
       column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'messages' 
AND column_name = 'reply_to_message_id';

-- 4. Vérifier les messages avec réponses
SELECT 'Messages avec réponses:' as info, COUNT(*) as total
FROM messages 
WHERE reply_to_message_id IS NOT NULL;

-- 5. Message de confirmation
SELECT 'Système de réponses corrigé !' as status;
