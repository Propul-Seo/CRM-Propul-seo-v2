-- Script temporaire sans RLS complexe
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Supprimer la table des réactions si elle existe
DROP TABLE IF EXISTS message_reactions CASCADE;

-- 2. Créer la table des réactions sans RLS complexe
CREATE TABLE message_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Un utilisateur ne peut réagir qu'une seule fois avec le même emoji à un message
  UNIQUE(message_id, user_id, emoji)
);

-- 3. Créer les index
CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX idx_message_reactions_user_id ON message_reactions(user_id);

-- 4. Activer RLS basique
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- 5. Politique simple : tout utilisateur authentifié peut tout faire
CREATE POLICY "Accès complet pour utilisateurs authentifiés" ON message_reactions
  FOR ALL USING (auth.role() = 'authenticated');

-- 6. Donner les permissions
GRANT SELECT, INSERT, DELETE ON message_reactions TO authenticated;

-- 7. Message de confirmation
SELECT 'Table des réactions créée avec RLS basique !' as status;
