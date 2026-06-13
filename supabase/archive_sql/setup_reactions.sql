-- Script pour créer le système de réactions aux messages
-- À exécuter dans l'éditeur SQL de Supabase

-- Créer la table des réactions
CREATE TABLE IF NOT EXISTS message_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Un utilisateur ne peut réagir qu'une seule fois avec le même emoji à un message
  UNIQUE(message_id, user_id, emoji)
);

-- Créer un index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON message_reactions(user_id);

-- Activer RLS
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- Politique RLS : tout utilisateur authentifié peut voir les réactions
CREATE POLICY "Tout le monde peut voir les réactions" ON message_reactions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Politique RLS : les utilisateurs peuvent ajouter/supprimer leurs propres réactions
CREATE POLICY "Utilisateurs peuvent gérer leurs réactions" ON message_reactions
  FOR ALL USING (auth.uid()::text = user_id::text);

-- Fonction pour obtenir les réactions d'un message
CREATE OR REPLACE FUNCTION get_message_reactions(message_uuid UUID)
RETURNS TABLE (
  emoji TEXT,
  count BIGINT,
  user_ids UUID[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mr.emoji,
    COUNT(*)::BIGINT,
    ARRAY_AGG(mr.user_id) as user_ids
  FROM message_reactions mr
  WHERE mr.message_id = message_uuid
  GROUP BY mr.emoji
  ORDER BY count DESC, emoji;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour ajouter une réaction
CREATE OR REPLACE FUNCTION add_message_reaction(
  message_uuid UUID,
  emoji_text TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_uuid UUID;
BEGIN
  -- Récupérer l'ID de l'utilisateur actuel
  SELECT id INTO current_user_uuid 
  FROM user_profiles 
  WHERE auth_user_id = auth.uid();
  
  IF current_user_uuid IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Insérer la réaction
  INSERT INTO message_reactions (message_id, user_id, emoji)
  VALUES (message_uuid, current_user_uuid, emoji_text)
  ON CONFLICT (message_id, user_id, emoji) DO NOTHING;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour supprimer une réaction
CREATE OR REPLACE FUNCTION remove_message_reaction(
  message_uuid UUID,
  emoji_text TEXT
)
RETURNS BOOLEAN AS $$
DECLARE
  current_user_uuid UUID;
BEGIN
  -- Récupérer l'ID de l'utilisateur actuel
  SELECT id INTO current_user_uuid 
  FROM user_profiles 
  WHERE auth_user_id = auth.uid();
  
  IF current_user_uuid IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Supprimer la réaction
  DELETE FROM message_reactions 
  WHERE message_id = message_uuid 
    AND user_id = current_user_uuid 
    AND emoji = emoji_text;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Donner les permissions nécessaires
GRANT SELECT, INSERT, DELETE ON message_reactions TO authenticated;
GRANT EXECUTE ON FUNCTION get_message_reactions(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION add_message_reaction(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION remove_message_reaction(UUID, TEXT) TO authenticated;

-- Message de confirmation
SELECT 'Système de réactions créé avec succès !' as status;
