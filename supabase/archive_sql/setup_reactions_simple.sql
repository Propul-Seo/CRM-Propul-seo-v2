-- Script simplifié pour créer le système de réactions aux messages
-- Compatible avec votre structure user_profiles actuelle
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
-- On utilise l'email pour identifier l'utilisateur
CREATE POLICY "Utilisateurs peuvent gérer leurs réactions" ON message_reactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM user_profiles up 
      WHERE up.id = message_reactions.user_id 
      AND up.email = auth.jwt() ->> 'email'
    )
  );

-- Donner les permissions nécessaires
GRANT SELECT, INSERT, DELETE ON message_reactions TO authenticated;

-- Message de confirmation
SELECT 'Table des réactions créée avec succès !' as status;
