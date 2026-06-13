-- Migration pour créer les tables de chat d'équipe
-- Date: 2025-01-31

-- =====================================================
-- TABLE: CHANNELS - Canaux de discussion
-- =====================================================

CREATE TABLE IF NOT EXISTS channels (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  is_private BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: MESSAGES - Messages dans les canaux
-- =====================================================

CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL,
  message_type TEXT DEFAULT 'text' CHECK (message_type IN ('text', 'file', 'image', 'audio')),
  attachments JSONB DEFAULT '[]',
  mentions UUID[] DEFAULT '{}', -- Array des utilisateurs mentionnés
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES pour optimiser les performances
-- =====================================================

-- Index pour les canaux
CREATE INDEX IF NOT EXISTS idx_channels_name ON channels(name);
CREATE INDEX IF NOT EXISTS idx_channels_created_by ON channels(created_by);
CREATE INDEX IF NOT EXISTS idx_channels_created_at ON channels(created_at);

-- Index pour les messages
CREATE INDEX IF NOT EXISTS idx_messages_channel_id ON messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_messages_user_id ON messages(user_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);
CREATE INDEX IF NOT EXISTS idx_messages_mentions ON messages USING GIN(mentions);

-- =====================================================
-- TRIGGERS pour mettre à jour updated_at
-- =====================================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_chat_tables_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour channels
CREATE TRIGGER trigger_update_channels_updated_at
  BEFORE UPDATE ON channels
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_tables_updated_at();

-- Triggers pour messages
CREATE TRIGGER trigger_update_messages_updated_at
  BEFORE UPDATE ON messages
  FOR EACH ROW
  EXECUTE FUNCTION update_chat_tables_updated_at();

-- =====================================================
-- POLICIES RLS (Row Level Security) pour Supabase
-- =====================================================

-- Activer RLS sur les tables
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Politique pour channels : tous les utilisateurs peuvent voir les canaux publics
CREATE POLICY "Canaux visibles par tous" ON channels
  FOR SELECT USING (true);

-- Politique pour channels : les utilisateurs connectés peuvent créer des canaux
CREATE POLICY "Création de canaux par utilisateurs connectés" ON channels
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Politique pour channels : les créateurs peuvent modifier/supprimer leurs canaux
CREATE POLICY "Modification de canaux par créateur" ON channels
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Suppression de canaux par créateur" ON channels
  FOR DELETE USING (created_by = auth.uid());

-- Politique pour messages : tous les utilisateurs peuvent voir les messages
CREATE POLICY "Messages visibles par tous" ON messages
  FOR SELECT USING (true);

-- Politique pour messages : les utilisateurs connectés peuvent envoyer des messages
CREATE POLICY "Envoi de messages par utilisateurs connectés" ON messages
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Politique pour messages : les auteurs peuvent modifier/supprimer leurs messages
CREATE POLICY "Modification de messages par auteur" ON messages
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Suppression de messages par auteur" ON messages
  FOR DELETE USING (user_id = auth.uid());

-- =====================================================
-- DONNÉES INITIALES (canaux par défaut)
-- =====================================================

-- Insérer des canaux par défaut si la table est vide
INSERT INTO channels (name, description) 
SELECT 'général', 'Canal principal pour les discussions générales de l''équipe'
WHERE NOT EXISTS (SELECT 1 FROM channels WHERE name = 'général');

INSERT INTO channels (name, description) 
SELECT 'projets', 'Canal dédié aux discussions sur les projets en cours'
WHERE NOT EXISTS (SELECT 1 FROM channels WHERE name = 'projets');

INSERT INTO channels (name, description) 
SELECT 'support', 'Canal pour le support technique et l''entraide'
WHERE NOT EXISTS (SELECT 1 FROM channels WHERE name = 'support');
