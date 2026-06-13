-- Script pour modifier la contrainte UNIQUE
-- Un utilisateur ne peut avoir qu'un seul emoji par message (pas plusieurs emojis différents)
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Supprimer l'ancienne contrainte UNIQUE
ALTER TABLE message_reactions DROP CONSTRAINT IF EXISTS unique_user_reaction;

-- 2. Ajouter la nouvelle contrainte : un utilisateur = un seul emoji par message
ALTER TABLE message_reactions 
ADD CONSTRAINT unique_user_per_message 
UNIQUE(message_id, user_id);

-- 3. Nettoyer les doublons : garder seulement le premier emoji de chaque utilisateur par message
DELETE FROM message_reactions 
WHERE id NOT IN (
  SELECT DISTINCT ON (message_id, user_id) id
  FROM message_reactions 
  ORDER BY message_id, user_id, created_at ASC
);

-- 4. Vérifier la nouvelle contrainte
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
SELECT 'Contrainte modifiée : un seul emoji par utilisateur par message !' as status;
