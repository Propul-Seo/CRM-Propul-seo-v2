-- Migration pour ajouter le système de réponses aux messages
-- Date: 2025-01-31

-- 1. Ajouter le champ reply_to_message_id à la table messages
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS reply_to_message_id UUID REFERENCES messages(id) ON DELETE SET NULL;

-- 2. Créer un index pour optimiser les requêtes de réponses
CREATE INDEX IF NOT EXISTS idx_messages_reply_to ON messages(reply_to_message_id);

-- 3. Créer une fonction pour obtenir les informations du message de réponse
CREATE OR REPLACE FUNCTION get_reply_message_info(reply_message_id UUID)
RETURNS TABLE (
  id UUID,
  content TEXT,
  sender_name TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.id,
    m.content,
    u.name as sender_name,
    m.created_at
  FROM messages m
  JOIN users u ON m.user_id = u.id
  WHERE m.id = reply_message_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Donner les permissions d'exécution
GRANT EXECUTE ON FUNCTION get_reply_message_info(UUID) TO authenticated;

-- 5. Message de confirmation
SELECT 'Système de réponses aux messages ajouté avec succès !' as status;
