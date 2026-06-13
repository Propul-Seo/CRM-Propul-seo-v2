-- Script pour nettoyer les doublons AVANT de créer la contrainte
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Voir les doublons existants
SELECT 
  message_id,
  user_id,
  COUNT(*) as count,
  array_agg(emoji) as emojis
FROM message_reactions 
GROUP BY message_id, user_id
HAVING COUNT(*) > 1
ORDER BY count DESC;

-- 2. Nettoyer les doublons : garder seulement le premier emoji de chaque utilisateur par message
DELETE FROM message_reactions 
WHERE id NOT IN (
  SELECT DISTINCT ON (message_id, user_id) id
  FROM message_reactions 
  ORDER BY message_id, user_id, created_at ASC
);

-- 3. Vérifier qu'il n'y a plus de doublons
SELECT 
  message_id,
  user_id,
  COUNT(*) as count
FROM message_reactions 
GROUP BY message_id, user_id
HAVING COUNT(*) > 1;

-- 4. Message de confirmation
SELECT 'Doublons nettoyés ! Maintenant vous pouvez créer la contrainte UNIQUE.' as status;
