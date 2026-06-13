-- Script pour permettre les réactions multiples avec le même emoji
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Supprimer l'ancienne contrainte UNIQUE qui empêchait les réactions multiples
ALTER TABLE message_reactions DROP CONSTRAINT IF EXISTS unique_user_reaction;
ALTER TABLE message_reactions DROP CONSTRAINT IF EXISTS unique_user_per_message;

-- 2. Ajouter la nouvelle contrainte : un utilisateur ne peut avoir qu'UNE SEULE réaction par message
-- (mais plusieurs utilisateurs peuvent réagir avec le même emoji)
ALTER TABLE message_reactions 
ADD CONSTRAINT unique_user_per_message 
UNIQUE(message_id, user_id);

-- 3. Nettoyer les doublons existants : garder seulement la première réaction de chaque utilisateur par message
DELETE FROM message_reactions 
WHERE id NOT IN (
  SELECT DISTINCT ON (message_id, user_id) id
  FROM message_reactions 
  ORDER BY message_id, user_id, created_at ASC
);

-- 4. Vérifier la nouvelle structure
SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
  ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'message_reactions' 
  AND tc.constraint_type = 'UNIQUE';

-- 5. Message de confirmation
SELECT 'Réactions multiples avec le même emoji maintenant autorisées !' as status;
