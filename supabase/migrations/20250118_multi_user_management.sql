-- Migration pour la gestion multi-utilisateurs avancée
-- Date: 2025-01-18

-- =====================================================
-- AMÉLIORATION DE LA TABLE USERS
-- =====================================================

-- Ajouter des colonnes pour la gestion d'équipe
ALTER TABLE users ADD COLUMN IF NOT EXISTS team_id UUID;
ALTER TABLE users ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES users(id);
ALTER TABLE users ADD COLUMN IF NOT EXISTS permissions JSONB DEFAULT '{}';
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_settings JSONB DEFAULT '{"email": true, "push": true, "in_app": true}';

-- =====================================================
-- TABLE: TEAMS - Gestion des équipes
-- =====================================================

CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  leader_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajouter la contrainte de clé étrangère pour team_id
ALTER TABLE users ADD CONSTRAINT fk_users_team_id 
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

-- =====================================================
-- TABLE: USER_ASSIGNMENTS - Traçabilité des assignations
-- =====================================================

CREATE TABLE IF NOT EXISTS user_assignments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  assigned_by UUID REFERENCES users(id) NOT NULL,
  assigned_to UUID REFERENCES users(id) NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('task', 'project', 'client', 'event')),
  entity_id UUID NOT NULL,
  assignment_date TIMESTAMPTZ DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: NOTIFICATIONS - Système de notifications
-- =====================================================

CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('assignment', 'deadline', 'mention', 'system', 'project_update')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  entity_type TEXT,
  entity_id UUID,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- TABLE: USER_SESSIONS - Sessions utilisateur
-- =====================================================

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  session_token TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  is_active BOOLEAN DEFAULT true,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- INDEXES pour optimiser les performances
-- =====================================================

-- Index pour users
CREATE INDEX IF NOT EXISTS idx_users_team_id ON users(team_id);
CREATE INDEX IF NOT EXISTS idx_users_manager_id ON users(manager_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

-- Index pour user_assignments
CREATE INDEX IF NOT EXISTS idx_user_assignments_assigned_by ON user_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_user_assignments_assigned_to ON user_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_user_assignments_entity ON user_assignments(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_user_assignments_status ON user_assignments(status);

-- Index pour notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at);

-- Index pour user_sessions
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_is_active ON user_sessions(is_active);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) - Sécurité par utilisateur
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- POLICIES RLS pour users
-- =====================================================

-- Les utilisateurs peuvent voir leur propre profil et les profils de leur équipe
CREATE POLICY "Users can view own profile and team members"
ON users FOR SELECT
TO authenticated
USING (
  auth.uid()::text = auth_user_id::text OR 
  team_id = (SELECT team_id FROM users WHERE auth_user_id = auth.uid())
);

-- Les admins peuvent voir tous les utilisateurs
CREATE POLICY "Admins can view all users"
ON users FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  )
);

-- Les utilisateurs peuvent modifier leur propre profil
CREATE POLICY "Users can update own profile"
ON users FOR UPDATE
TO authenticated
USING (auth.uid()::text = auth_user_id::text);

-- Les admins peuvent modifier tous les profils
CREATE POLICY "Admins can update all profiles"
ON users FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- POLICIES RLS pour teams
-- =====================================================

-- Les utilisateurs peuvent voir leur équipe
CREATE POLICY "Users can view own team"
ON teams FOR SELECT
TO authenticated
USING (
  id = (SELECT team_id FROM users WHERE auth_user_id = auth.uid())
);

-- Les admins peuvent voir toutes les équipes
CREATE POLICY "Admins can view all teams"
ON teams FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM users 
    WHERE auth_user_id = auth.uid() AND role = 'admin'
  )
);

-- =====================================================
-- POLICIES RLS pour user_assignments
-- =====================================================

-- Les utilisateurs peuvent voir leurs assignations
CREATE POLICY "Users can view own assignments"
ON user_assignments FOR SELECT
TO authenticated
USING (
  assigned_to = (SELECT id FROM users WHERE auth_user_id = auth.uid()) OR
  assigned_by = (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- Les utilisateurs peuvent créer des assignations
CREATE POLICY "Users can create assignments"
ON user_assignments FOR INSERT
TO authenticated
WITH CHECK (
  assigned_by = (SELECT id FROM users WHERE auth_user_id = auth.uid())
);

-- =====================================================
-- POLICIES RLS pour notifications
-- =====================================================

-- Les utilisateurs peuvent voir leurs notifications
CREATE POLICY "Users can view own notifications"
ON notifications FOR SELECT
TO authenticated
USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- Les utilisateurs peuvent marquer leurs notifications comme lues
CREATE POLICY "Users can update own notifications"
ON notifications FOR UPDATE
TO authenticated
USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- =====================================================
-- POLICIES RLS pour user_sessions
-- =====================================================

-- Les utilisateurs peuvent voir leurs sessions
CREATE POLICY "Users can view own sessions"
ON user_sessions FOR SELECT
TO authenticated
USING (user_id = (SELECT id FROM users WHERE auth_user_id = auth.uid()));

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour obtenir les permissions d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_permissions(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  user_role TEXT;
  user_permissions JSONB;
BEGIN
  SELECT role, permissions INTO user_role, user_permissions
  FROM users WHERE auth_user_id = user_uuid;
  
  -- Permissions par défaut selon le rôle
  CASE user_role
    WHEN 'admin' THEN
      RETURN '{"all": true, "read": true, "write": true, "delete": true, "admin": true}'::JSONB;
    WHEN 'manager' THEN
      RETURN '{"read": true, "write": true, "delete": false, "admin": false, "team_management": true}'::JSONB;
    WHEN 'developer' THEN
      RETURN '{"read": true, "write": true, "delete": false, "admin": false, "technical": true}'::JSONB;
    WHEN 'sales' THEN
      RETURN '{"read": true, "write": true, "delete": false, "admin": false, "sales": true}'::JSONB;
    ELSE
      RETURN '{"read": true, "write": false, "delete": false, "admin": false}'::JSONB;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour vérifier si un utilisateur peut accéder à une ressource
CREATE OR REPLACE FUNCTION can_access_resource(
  user_uuid UUID,
  resource_type TEXT,
  resource_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  user_permissions JSONB;
  user_team_id UUID;
  resource_user_id UUID;
BEGIN
  -- Obtenir les permissions de l'utilisateur
  user_permissions := get_user_permissions(user_uuid);
  
  -- Si l'utilisateur a tous les droits, autoriser
  IF (user_permissions->>'all')::BOOLEAN THEN
    RETURN true;
  END IF;
  
  -- Obtenir l'équipe de l'utilisateur
  SELECT team_id INTO user_team_id FROM users WHERE auth_user_id = user_uuid;
  
  -- Vérifier selon le type de ressource
  CASE resource_type
    WHEN 'own_data' THEN
      -- L'utilisateur peut toujours accéder à ses propres données
      RETURN true;
      
    WHEN 'team_data' THEN
      -- Vérifier si la ressource appartient à l'équipe
      IF resource_id IS NOT NULL THEN
        SELECT user_id INTO resource_user_id 
        FROM users WHERE id = resource_id;
        
        IF resource_user_id IS NOT NULL THEN
          SELECT team_id INTO resource_user_id 
          FROM users WHERE id = resource_user_id;
          
          RETURN resource_user_id = user_team_id;
        END IF;
      END IF;
      RETURN false;
      
    WHEN 'all_data' THEN
      -- Seuls les admins peuvent accéder à toutes les données
      RETURN (user_permissions->>'admin')::BOOLEAN;
      
    ELSE
      RETURN false;
  END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour créer une notification
CREATE OR REPLACE FUNCTION create_notification(
  target_user_id UUID,
  notification_type TEXT,
  notification_title TEXT,
  notification_message TEXT,
  entity_type TEXT DEFAULT NULL,
  entity_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  notification_id UUID;
BEGIN
  INSERT INTO notifications (
    user_id, type, title, message, entity_type, entity_id
  ) VALUES (
    target_user_id, notification_type, notification_title, 
    notification_message, entity_type, entity_id
  ) RETURNING id INTO notification_id;
  
  RETURN notification_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction pour assigner une tâche/projet à un utilisateur
CREATE OR REPLACE FUNCTION assign_to_user(
  assigned_by_uuid UUID,
  assigned_to_uuid UUID,
  entity_type TEXT,
  entity_id UUID,
  notes TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  assignment_id UUID;
  assigned_by_id UUID;
  assigned_to_id UUID;
BEGIN
  -- Obtenir les IDs des utilisateurs
  SELECT id INTO assigned_by_id FROM users WHERE auth_user_id = assigned_by_uuid;
  SELECT id INTO assigned_to_id FROM users WHERE auth_user_id = assigned_to_uuid;
  
  -- Créer l'assignation
  INSERT INTO user_assignments (
    assigned_by, assigned_to, entity_type, entity_id, notes
  ) VALUES (
    assigned_by_id, assigned_to_id, entity_type, entity_id, notes
  ) RETURNING id INTO assignment_id;
  
  -- Créer une notification pour l'utilisateur assigné
  PERFORM create_notification(
    assigned_to_id,
    'assignment',
    'Nouvelle assignation',
    'Vous avez été assigné à une nouvelle ' || entity_type,
    entity_type,
    entity_id
  );
  
  RETURN assignment_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- TRIGGERS pour automatisation
-- =====================================================

-- Trigger pour mettre à jour updated_at
CREATE TRIGGER update_teams_updated_at
BEFORE UPDATE ON teams
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_assignments_updated_at
BEFORE UPDATE ON user_assignments
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour créer automatiquement un profil utilisateur
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO users (
    auth_user_id,
    name,
    email,
    role
  ) VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'sales')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger pour les nouveaux utilisateurs auth
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- =====================================================
-- VUES pour faciliter les requêtes
-- =====================================================

-- Vue pour les utilisateurs avec leurs équipes
CREATE OR REPLACE VIEW user_team_view AS
SELECT 
  u.id,
  u.auth_user_id,
  u.name,
  u.email,
  u.role,
  u.avatar_url,
  u.is_active,
  t.id as team_id,
  t.name as team_name,
  t.leader_id,
  m.name as manager_name
FROM users u
LEFT JOIN teams t ON u.team_id = t.id
LEFT JOIN users m ON u.manager_id = m.id
WHERE u.is_active = true;

-- Vue pour les assignations avec détails
CREATE OR REPLACE VIEW assignment_details_view AS
SELECT 
  ua.id,
  ua.entity_type,
  ua.entity_id,
  ua.status,
  ua.assignment_date,
  ua.notes,
  assigned_by.name as assigned_by_name,
  assigned_to.name as assigned_to_name,
  assigned_by.email as assigned_by_email,
  assigned_to.email as assigned_to_email
FROM user_assignments ua
JOIN users assigned_by ON ua.assigned_by = assigned_by.id
JOIN users assigned_to ON ua.assigned_to = assigned_to.id
WHERE ua.status = 'active';

-- =====================================================
-- COMMENTAIRES pour la documentation
-- =====================================================

COMMENT ON TABLE teams IS 'Équipes d''utilisateurs pour la gestion multi-utilisateurs';
COMMENT ON TABLE user_assignments IS 'Traçabilité des assignations de tâches/projets';
COMMENT ON TABLE notifications IS 'Système de notifications temps réel';
COMMENT ON TABLE user_sessions IS 'Sessions utilisateur pour la sécurité';

COMMENT ON FUNCTION get_user_permissions IS 'Retourne les permissions d''un utilisateur selon son rôle';
COMMENT ON FUNCTION can_access_resource IS 'Vérifie si un utilisateur peut accéder à une ressource';
COMMENT ON FUNCTION create_notification IS 'Crée une notification pour un utilisateur';
COMMENT ON FUNCTION assign_to_user IS 'Assigne une tâche/projet à un utilisateur avec notification'; 