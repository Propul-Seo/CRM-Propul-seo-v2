-- Script de réactions qui fonctionne avec votre structure
-- À exécuter dans l'éditeur SQL de Supabase

-- 1. Supprimer la table des réactions si elle existe
DROP TABLE IF EXISTS message_reactions CASCADE;

-- 2. Supprimer les fonctions RPC si elles existent
DROP FUNCTION IF EXISTS get_message_reactions(UUID);
DROP FUNCTION IF EXISTS add_message_reaction(UUID, TEXT);
DROP FUNCTION IF EXISTS remove_message_reaction(UUID, TEXT);

-- 3. Recréer la table des réactions
CREATE TABLE message_reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Un utilisateur ne peut réagir qu'une seule fois avec le même emoji à un message
  UNIQUE(message_id, user_id, emoji)
);

-- 4. Créer les index
CREATE INDEX idx_message_reactions_message_id ON message_reactions(message_id);
CREATE INDEX idx_message_reactions_user_id ON message_reactions(user_id);

-- 5. Activer RLS
ALTER TABLE message_reactions ENABLE ROW LEVEL SECURITY;

-- 6. Créer les politiques RLS basées sur users.email
CREATE POLICY "Tout le monde peut voir les réactions" ON message_reactions
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Utilisateurs peuvent gérer leurs réactions" ON message_reactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users u
      WHERE u.id = message_reactions.user_id
      AND u.email = auth.jwt() ->> 'email'
    )
  );

-- 7. Donner les permissions
GRANT SELECT, INSERT, DELETE ON message_reactions TO authenticated;

-- 8. Message de confirmation
SELECT 'Système de réactions créé avec succès !' as status;
