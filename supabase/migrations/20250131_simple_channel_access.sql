-- Migration simple pour contrôler l'accès aux canaux
-- Date: 2025-01-31

-- =====================================================
-- SIMPLIFICATION : Ajouter des champs d'accès directs
-- =====================================================

-- 1. Ajouter des champs de contrôle d'accès sur la table channels
ALTER TABLE channels 
ADD COLUMN IF NOT EXISTS allowed_users UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS allowed_roles TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT true;

-- 2. Ajouter des commentaires pour expliquer l'usage
COMMENT ON COLUMN channels.allowed_users IS 'Liste des IDs utilisateurs autorisés (vide = tous)';
COMMENT ON COLUMN channels.allowed_roles IS 'Liste des rôles autorisés (vide = tous)';
COMMENT ON COLUMN channels.is_public IS 'Si true, visible par tous. Si false, seulement par allowed_users/roles';

-- =====================================================
-- MISE À JOUR DES POLITIQUES RLS EXISTANTES
-- =====================================================

-- Supprimer les anciennes politiques trop permissives
DROP POLICY IF EXISTS "Canaux visibles par tous" ON channels;
DROP POLICY IF EXISTS "Messages visibles par tous" ON messages;

-- Nouvelle politique pour channels : contrôle d'accès intelligent
CREATE POLICY "Contrôle d'accès aux canaux" ON channels
  FOR SELECT USING (
    -- Canal public : visible par tous
    is_public = true
    OR
    -- Canal privé : vérifier les permissions
    (
      is_public = false AND (
        -- Utilisateur dans la liste autorisée
        auth.uid() = ANY(allowed_users)
        OR
        -- Rôle de l'utilisateur dans la liste autorisée
        EXISTS (
          SELECT 1 FROM users 
          WHERE auth_user_id = auth.uid() 
          AND role::text = ANY(allowed_roles)
        )
        OR
        -- Canal créé par l'utilisateur actuel (si applicable)
        false
      )
    )
  );

-- Nouvelle politique pour messages : même logique d'accès
CREATE POLICY "Contrôle d'accès aux messages" ON messages
  FOR SELECT USING (
    -- Vérifier l'accès au canal parent
    EXISTS (
      SELECT 1 FROM channels c
      WHERE c.id = messages.channel_id
      AND (
        c.is_public = true
        OR
        (
          c.is_public = false AND (
            auth.uid() = ANY(c.allowed_users)
            OR
            EXISTS (
              SELECT 1 FROM users 
              WHERE auth_user_id = auth.uid() 
              AND role::text = ANY(c.allowed_roles)
            )
            OR
            false
          )
        )
      )
    )
  );

-- =====================================================
-- FONCTIONS UTILITAIRES SIMPLES
-- =====================================================

-- Fonction pour vérifier si un utilisateur peut accéder à un canal
CREATE OR REPLACE FUNCTION can_access_channel(channel_uuid UUID, user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  channel_record RECORD;
BEGIN
  SELECT * INTO channel_record FROM channels WHERE id = channel_uuid;
  
  -- Canal public : accès autorisé
  IF channel_record.is_public THEN
    RETURN true;
  END IF;
  
  -- Canal privé : vérifier les permissions
  RETURN (
    user_uuid = ANY(channel_record.allowed_users)
    OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = user_uuid 
      AND role::text = ANY(channel_record.allowed_roles)
    )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour obtenir les canaux accessibles par un utilisateur
CREATE OR REPLACE FUNCTION get_accessible_channels(user_uuid UUID)
RETURNS TABLE (
  id UUID,
  name TEXT,
  description TEXT,
  is_public BOOLEAN,
  access_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.name,
    c.description,
    c.is_public,
    CASE 
      WHEN c.is_public THEN 'public'
      WHEN user_uuid = ANY(c.allowed_users) THEN 'user_access'
      WHEN EXISTS (
        SELECT 1 FROM users 
        WHERE id = user_uuid 
        AND role::text = ANY(c.allowed_roles)
      ) THEN 'role_access'
      WHEN false THEN 'owner'
      ELSE 'no_access'
    END as access_type
  FROM channels c
  WHERE 
    c.is_public = true
    OR
    user_uuid = ANY(c.allowed_users)
    OR
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = user_uuid 
      AND role::text = ANY(c.allowed_roles)
    )
    OR
    false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- DONNÉES INITIALES : CONFIGURER L'ACCÈS AUX CANAUX
-- =====================================================

-- Canal général : public pour tous
UPDATE channels 
SET is_public = true, allowed_users = '{}', allowed_roles = '{}'
WHERE name = 'général';

-- Canal projets : visible par les rôles 'admin' et 'manager'
UPDATE channels 
SET is_public = false, allowed_users = '{}', allowed_roles = '{admin,manager}'
WHERE name = 'projets';

-- Canal support : visible par tous les utilisateurs connectés (rôles spécifiques)
UPDATE channels 
SET is_public = false, allowed_users = '{}', allowed_roles = '{admin,manager,developer,sales}'
WHERE name = 'support';

-- =====================================================
-- INDEXES pour optimiser les performances
-- =====================================================

CREATE INDEX IF NOT EXISTS idx_channels_is_public ON channels(is_public);
CREATE INDEX IF NOT EXISTS idx_channels_allowed_users ON channels USING GIN(allowed_users);
CREATE INDEX IF NOT EXISTS idx_channels_allowed_roles ON channels USING GIN(allowed_roles);
