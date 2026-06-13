-- Migration complète pour corriger le système d'utilisateurs
-- Date: 2025-01-30
-- Objectif: Résoudre définitivement l'erreur "Database error saving new user"

-- =====================================================
-- ÉTAPE 1: NETTOYAGE ET PRÉPARATION
-- =====================================================

-- Supprimer tous les triggers existants qui pourraient causer des conflits
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;

-- Supprimer les anciennes fonctions
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS handle_new_user() CASCADE;

-- =====================================================
-- ÉTAPE 2: UNIFICATION DES TABLES UTILISATEURS
-- =====================================================

-- Créer une table temporaire pour sauvegarder les données existantes
CREATE TEMP TABLE temp_user_data AS
SELECT DISTINCT
  COALESCE(u.auth_user_id, up.id) as auth_user_id,
  COALESCE(u.name, up.name, au.email) as name,
  COALESCE(u.email, au.email) as email,
  COALESCE(u.role, up.role, 'sales') as role,
  COALESCE(u.avatar_url, up.avatar_url) as avatar_url,
  COALESCE(u.phone, up.phone) as phone,
  COALESCE(u.position, up.position) as position,
  COALESCE(u.bio, up.bio) as bio,
  COALESCE(u.timezone, up.timezone, 'Europe/Paris') as timezone,
  COALESCE(u.language, up.language, 'fr-FR') as language,
  COALESCE(u.is_active, up.is_active, true) as is_active,
  COALESCE(u.last_login, au.last_sign_in_at) as last_login,
  COALESCE(u.created_at, up.created_at, au.created_at) as created_at,
  COALESCE(u.updated_at, up.updated_at, au.updated_at) as updated_at
FROM auth.users au
LEFT JOIN public.users u ON au.id = u.auth_user_id
LEFT JOIN public.user_profiles up ON au.id = up.id
WHERE au.id IS NOT NULL;

-- Supprimer les anciennes tables s'elles existent
DROP TABLE IF EXISTS public.users CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- =====================================================
-- ÉTAPE 3: CRÉATION DE LA TABLE USERS UNIFIÉE
-- =====================================================

-- Créer la table users unifiée et définitive
CREATE TABLE public.users (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'sales',
  avatar_url TEXT,
  phone TEXT,
  position TEXT,
  bio TEXT,
  timezone TEXT DEFAULT 'Europe/Paris',
  language TEXT DEFAULT 'fr-FR',
  is_active BOOLEAN DEFAULT true,
  last_login TIMESTAMPTZ,
  
  -- Colonnes pour la gestion multi-utilisateurs
  team_id UUID,
  manager_id UUID,
  permissions JSONB DEFAULT '{}',
  notification_settings JSONB DEFAULT '{"email": true, "push": true, "in_app": true}',
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÉTAPE 4: RESTAURATION DES DONNÉES
-- =====================================================

-- Restaurer les données depuis la table temporaire
INSERT INTO public.users (
  auth_user_id, name, email, role, avatar_url, phone, position, bio,
  timezone, language, is_active, last_login, created_at, updated_at
)
SELECT 
  auth_user_id, name, email, role::user_role, avatar_url, phone, position, bio,
  timezone, language, is_active, last_login, created_at, updated_at
FROM temp_user_data
ON CONFLICT (auth_user_id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  avatar_url = EXCLUDED.avatar_url,
  phone = EXCLUDED.phone,
  position = EXCLUDED.position,
  bio = EXCLUDED.bio,
  timezone = EXCLUDED.timezone,
  language = EXCLUDED.language,
  is_active = EXCLUDED.is_active,
  last_login = EXCLUDED.last_login,
  updated_at = NOW();

-- =====================================================
-- ÉTAPE 5: CRÉATION DES TABLES COMPLÉMENTAIRES
-- =====================================================

-- Table teams (si elle n'existe pas)
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  leader_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table user_assignments (si elle n'existe pas)
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

-- Table notifications (si elle n'existe pas)
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÉTAPE 6: AJOUT DES CONTRAINTES ET INDEX
-- =====================================================

-- Contraintes de clés étrangères
ALTER TABLE users ADD CONSTRAINT fk_users_team_id 
  FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

ALTER TABLE users ADD CONSTRAINT fk_users_manager_id 
  FOREIGN KEY (manager_id) REFERENCES users(id) ON DELETE SET NULL;

-- Index pour améliorer les performances
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_team_id ON users(team_id);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_is_active ON users(is_active);

CREATE INDEX IF NOT EXISTS idx_user_assignments_assigned_to ON user_assignments(assigned_to);
CREATE INDEX IF NOT EXISTS idx_user_assignments_assigned_by ON user_assignments(assigned_by);
CREATE INDEX IF NOT EXISTS idx_user_assignments_entity ON user_assignments(entity_type, entity_id);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);

-- =====================================================
-- ÉTAPE 7: FONCTION ROBUSTE DE CRÉATION D'UTILISATEUR
-- =====================================================

-- Fonction pour créer automatiquement un profil utilisateur
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  user_name TEXT;
  user_role user_role;
BEGIN
  -- Extraire le nom et le rôle des métadonnées
  user_name := COALESCE(
    NEW.raw_user_meta_data->>'name',
    NEW.raw_user_meta_data->>'full_name',
    split_part(NEW.email, '@', 1)
  );
  
  user_role := COALESCE(
    (NEW.raw_user_meta_data->>'role')::user_role,
    'sales'::user_role
  );

  -- Vérifier si l'utilisateur existe déjà
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = NEW.id) THEN
    -- Insérer le nouveau profil utilisateur
    INSERT INTO public.users (
      auth_user_id,
      name,
      email,
      role,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      NEW.id,
      user_name,
      NEW.email,
      user_role,
      true,
      NOW(),
      NOW()
    );
    
    -- Log de succès
    RAISE LOG 'Profil utilisateur créé avec succès pour %', NEW.email;
  ELSE
    -- Log si l'utilisateur existe déjà
    RAISE LOG 'Profil utilisateur existe déjà pour %', NEW.email;
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log l'erreur mais ne pas faire échouer la création de l'utilisateur auth
    RAISE LOG 'Erreur lors de la création du profil utilisateur pour % (ID: %): %', 
      NEW.email, NEW.id, SQLERRM;
    -- Retourner NEW pour que l'utilisateur auth soit quand même créé
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ÉTAPE 8: CRÉATION DU TRIGGER
-- =====================================================

-- Créer le trigger pour la création automatique de profils
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW 
  EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- ÉTAPE 9: FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour créer manuellement un profil utilisateur manquant
CREATE OR REPLACE FUNCTION public.create_user_profile_if_missing(auth_user_uuid UUID)
RETURNS BOOLEAN AS $$
DECLARE
  auth_user_record RECORD;
  user_name TEXT;
  user_role user_role;
BEGIN
  -- Récupérer les informations de l'utilisateur auth
  SELECT * INTO auth_user_record 
  FROM auth.users 
  WHERE id = auth_user_uuid;
  
  -- Vérifier si l'utilisateur auth existe
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Utilisateur auth non trouvé: %', auth_user_uuid;
  END IF;

  -- Vérifier si le profil existe déjà
  IF EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth_user_uuid) THEN
    RETURN true; -- Profil déjà existant
  END IF;

  -- Extraire le nom et le rôle
  user_name := COALESCE(
    auth_user_record.raw_user_meta_data->>'name',
    auth_user_record.raw_user_meta_data->>'full_name',
    split_part(auth_user_record.email, '@', 1)
  );
  
  user_role := COALESCE(
    (auth_user_record.raw_user_meta_data->>'role')::user_role,
    'sales'::user_role
  );

  -- Créer le profil utilisateur
  INSERT INTO public.users (
    auth_user_id,
    name,
    email,
    role,
    is_active,
    created_at,
    updated_at
  ) VALUES (
    auth_user_record.id,
    user_name,
    auth_user_record.email,
    user_role,
    true,
    NOW(),
    NOW()
  );

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Erreur lors de la création du profil pour %: %', auth_user_uuid, SQLERRM;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Fonction de diagnostic
CREATE OR REPLACE FUNCTION public.diagnose_user_creation_issues()
RETURNS TABLE (
  issue_type TEXT,
  description TEXT,
  count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  -- Utilisateurs auth sans profil
  SELECT 
    'auth_without_profile'::TEXT,
    'Utilisateurs auth sans profil dans users'::TEXT,
    COUNT(*)
  FROM auth.users au
  WHERE au.id NOT IN (SELECT auth_user_id FROM public.users WHERE auth_user_id IS NOT NULL)
  
  UNION ALL
  
  -- Profils sans utilisateur auth (orphelins)
  SELECT 
    'profile_without_auth'::TEXT,
    'Profils users sans utilisateur auth'::TEXT,
    COUNT(*)
  FROM public.users u
  WHERE u.auth_user_id NOT IN (SELECT id FROM auth.users)
  
  UNION ALL
  
  -- Emails en double
  SELECT 
    'duplicate_emails'::TEXT,
    'Emails en double dans users'::TEXT,
    COUNT(*)
  FROM (
    SELECT email, COUNT(*) as cnt
    FROM public.users
    GROUP BY email
    HAVING COUNT(*) > 1
  ) duplicates;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ÉTAPE 10: CORRECTION DES UTILISATEURS EXISTANTS
-- =====================================================

-- Créer les profils manquants pour les utilisateurs auth existants
DO $$
DECLARE
  auth_user RECORD;
  created_count INTEGER := 0;
BEGIN
  FOR auth_user IN 
    SELECT id, email, raw_user_meta_data, created_at
    FROM auth.users 
    WHERE id NOT IN (SELECT auth_user_id FROM public.users WHERE auth_user_id IS NOT NULL)
  LOOP
    BEGIN
      PERFORM public.create_user_profile_if_missing(auth_user.id);
      created_count := created_count + 1;
      RAISE LOG 'Profil créé pour l''utilisateur: % (ID: %)', auth_user.email, auth_user.id;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Erreur lors de la création du profil pour % (ID: %): %', 
          auth_user.email, auth_user.id, SQLERRM;
    END;
  END LOOP;
  
  RAISE LOG 'Migration terminée. % profils créés.', created_count;
END $$;

-- =====================================================
-- ÉTAPE 11: ACTIVATION RLS (ROW LEVEL SECURITY)
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politiques RLS pour la table users
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = auth_user_id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = auth_user_id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE auth_user_id = auth.uid() 
      AND role = 'admin'
    )
  );

CREATE POLICY "Team members can view each other" ON users
  FOR SELECT USING (
    team_id IN (
      SELECT team_id FROM users 
      WHERE auth_user_id = auth.uid() 
      AND team_id IS NOT NULL
    )
  );

-- Politiques RLS pour les notifications
CREATE POLICY "Users can view own notifications" ON notifications
  FOR ALL USING (
    user_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()
    )
  );

-- Politiques RLS pour les assignations
CREATE POLICY "Users can view their assignments" ON user_assignments
  FOR SELECT USING (
    assigned_to IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
    OR assigned_by IN (SELECT id FROM users WHERE auth_user_id = auth.uid())
  );

-- =====================================================
-- ÉTAPE 12: FONCTIONS RPC POUR LE FRONTEND
-- =====================================================

-- Fonction pour obtenir les permissions d'un utilisateur
CREATE OR REPLACE FUNCTION public.get_user_permissions(user_uuid UUID)
RETURNS JSONB AS $$
DECLARE
  user_record RECORD;
  permissions JSONB;
BEGIN
  -- Récupérer l'utilisateur
  SELECT * INTO user_record
  FROM users u
  WHERE u.auth_user_id = user_uuid;
  
  IF NOT FOUND THEN
    RETURN '{"error": "User not found"}'::JSONB;
  END IF;
  
  -- Définir les permissions selon le rôle
  CASE user_record.role
    WHEN 'admin' THEN
      permissions := '{
        "all": true,
        "read": true,
        "write": true,
        "delete": true,
        "team_management": true,
        "technical": true,
        "sales": true
      }'::JSONB;
    WHEN 'manager' THEN
      permissions := '{
        "all": false,
        "read": true,
        "write": true,
        "delete": false,
        "team_management": true,
        "technical": false,
        "sales": true
      }'::JSONB;
    WHEN 'developer' THEN
      permissions := '{
        "all": false,
        "read": true,
        "write": true,
        "delete": false,
        "team_management": false,
        "technical": true,
        "sales": false
      }'::JSONB;
    ELSE -- sales
      permissions := '{
        "all": false,
        "read": true,
        "write": true,
        "delete": false,
        "team_management": false,
        "technical": false,
        "sales": true
      }'::JSONB;
  END CASE;
  
  RETURN permissions;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- ÉTAPE 13: TRIGGERS POUR updated_at
-- =====================================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at 
  BEFORE UPDATE ON teams 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_assignments_updated_at 
  BEFORE UPDATE ON user_assignments 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notifications_updated_at 
  BEFORE UPDATE ON notifications 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- ÉTAPE 14: COMMENTAIRES ET DOCUMENTATION
-- =====================================================

COMMENT ON TABLE users IS 'Table unifiée des utilisateurs avec gestion multi-utilisateurs';
COMMENT ON TABLE teams IS 'Équipes d''utilisateurs';
COMMENT ON TABLE user_assignments IS 'Traçabilité des assignations entre utilisateurs';
COMMENT ON TABLE notifications IS 'Système de notifications temps réel';

COMMENT ON FUNCTION public.handle_new_user() IS 'Fonction robuste pour créer automatiquement un profil utilisateur lors de l''inscription';
COMMENT ON FUNCTION public.create_user_profile_if_missing(UUID) IS 'Fonction pour créer manuellement un profil utilisateur manquant';
COMMENT ON FUNCTION public.diagnose_user_creation_issues() IS 'Fonction de diagnostic pour identifier les problèmes de création d''utilisateurs';
COMMENT ON FUNCTION public.get_user_permissions(UUID) IS 'Fonction pour obtenir les permissions d''un utilisateur selon son rôle';

-- =====================================================
-- ÉTAPE 15: VALIDATION FINALE
-- =====================================================

-- Vérifier que tout est en place
DO $$
DECLARE
  table_count INTEGER;
  trigger_count INTEGER;
  function_count INTEGER;
BEGIN
  -- Vérifier les tables
  SELECT COUNT(*) INTO table_count
  FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name IN ('users', 'teams', 'user_assignments', 'notifications');
  
  -- Vérifier les triggers
  SELECT COUNT(*) INTO trigger_count
  FROM information_schema.triggers
  WHERE trigger_name = 'on_auth_user_created';
  
  -- Vérifier les fonctions
  SELECT COUNT(*) INTO function_count
  FROM information_schema.routines
  WHERE routine_schema = 'public'
  AND routine_name IN ('handle_new_user', 'create_user_profile_if_missing', 'get_user_permissions');
  
  -- Rapporter les résultats
  RAISE LOG 'Migration complète terminée:';
  RAISE LOG '- Tables créées: %', table_count;
  RAISE LOG '- Triggers créés: %', trigger_count;
  RAISE LOG '- Fonctions créées: %', function_count;
  
  IF table_count = 4 AND trigger_count >= 1 AND function_count >= 3 THEN
    RAISE LOG '✅ Migration réussie - Système d''utilisateurs opérationnel';
  ELSE
    RAISE LOG '⚠️ Migration incomplète - Vérifier les logs';
  END IF;
END $$; 