-- Migration pour ajouter la gestion des membres des canaux
-- Date: 2025-01-31

-- =====================================================
-- TABLE: CHANNEL_MEMBERS - Membres des canaux
-- =====================================================

CREATE TABLE IF NOT EXISTS channel_members (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role TEXT DEFAULT 'member' CHECK (role IN ('admin', 'member')) NOT NULL,
  joined_at TIMESTAMPTZ DEFAULT NOW(),
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  -- Contrainte d'unicité : un utilisateur ne peut être qu'une fois dans un canal
  UNIQUE(channel_id, user_id)
);

-- =====================================================
-- INDEXES pour optimiser les performances
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_channel_members_channel_id ON channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_user_id ON channel_members(user_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_role ON channel_members(role);

-- =====================================================
-- POLICIES RLS (Row Level Security) pour Supabase
-- =====================================================

-- Activer RLS sur la table
ALTER TABLE channel_members ENABLE ROW LEVEL SECURITY;

-- Politique : les membres d'un canal peuvent voir les autres membres
CREATE POLICY "Membres visibles par les membres du canal" ON channel_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM channel_members cm 
      WHERE cm.channel_id = channel_members.channel_id 
      AND cm.user_id = auth.uid()
    )
  );

-- Politique : seuls les admins du canal peuvent ajouter des membres
CREATE POLICY "Ajout de membres par les admins du canal" ON channel_members
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM channel_members cm 
      WHERE cm.channel_id = channel_members.channel_id 
      AND cm.user_id = auth.uid() 
      AND cm.role = 'admin'
    )
  );

-- Politique : seuls les admins du canal peuvent modifier les rôles
CREATE POLICY "Modification des rôles par les admins du canal" ON channel_members
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM channel_members cm 
      WHERE cm.channel_id = channel_members.channel_id 
      AND cm.user_id = auth.uid() 
      AND cm.role = 'admin'
    )
  );

-- Politique : seuls les admins du canal peuvent supprimer des membres
CREATE POLICY "Suppression de membres par les admins du canal" ON channel_members
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM channel_members cm 
      WHERE cm.channel_id = channel_members.channel_id 
      AND cm.user_id = auth.uid() 
      AND cm.role = 'admin'
    )
  );

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour obtenir les membres d'un canal
CREATE OR REPLACE FUNCTION get_channel_members(channel_uuid UUID)
RETURNS TABLE (
  user_id UUID,
  name TEXT,
  email TEXT,
  role TEXT,
  joined_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cm.user_id,
    u.name,
    u.email,
    cm.role,
    cm.joined_at
  FROM channel_members cm
  JOIN users u ON cm.user_id = u.id
  WHERE cm.channel_id = channel_uuid
  ORDER BY cm.joined_at ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si un utilisateur est admin d'un canal
CREATE OR REPLACE FUNCTION is_channel_admin(channel_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM channel_members 
    WHERE channel_id = channel_uuid 
    AND user_id = user_uuid 
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- DONNÉES INITIALES
-- =====================================================

-- Ajouter tous les utilisateurs existants comme membres du canal général
-- (seulement si la table channel_members est vide)
INSERT INTO channel_members (channel_id, user_id, role)
SELECT 
  c.id as channel_id,
  u.id as user_id,
  CASE WHEN u.role = 'admin' THEN 'admin' ELSE 'member' END as role
FROM channels c
CROSS JOIN users u
WHERE c.name = 'général' 
AND u.is_active = true
AND NOT EXISTS (
  SELECT 1 FROM channel_members cm 
  WHERE cm.channel_id = c.id AND cm.user_id = u.id
);
