-- Migration pour corriger la création d'utilisateurs
-- Date: 2025-01-18

-- =====================================================
-- CORRECTION DE LA FONCTION handle_new_user
-- =====================================================

-- Supprimer l'ancien trigger s'il existe
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Recréer la fonction handle_new_user avec gestion d'erreur améliorée
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  -- Vérifier si l'utilisateur existe déjà dans la table users
  IF NOT EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = NEW.id) THEN
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
      COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
      NEW.email,
      COALESCE(NEW.raw_user_meta_data->>'role', 'sales')::user_role,
      true,
      NOW(),
      NOW()
    );
  END IF;
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log l'erreur mais ne pas faire échouer la création de l'utilisateur auth
    RAISE LOG 'Erreur lors de la création du profil utilisateur pour %: %', NEW.email, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recréer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =====================================================
-- FONCTION DE RÉCUPÉRATION POUR LES UTILISATEURS EXISTANTS
-- =====================================================

-- Fonction pour créer manuellement un profil utilisateur
CREATE OR REPLACE FUNCTION create_user_profile_if_missing(auth_user_uuid UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- Vérifier si l'utilisateur existe dans auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = auth_user_uuid) THEN
    RAISE EXCEPTION 'Utilisateur auth non trouvé: %', auth_user_uuid;
  END IF;

  -- Vérifier si le profil existe déjà
  IF EXISTS (SELECT 1 FROM public.users WHERE auth_user_id = auth_user_uuid) THEN
    RETURN true; -- Profil déjà existant
  END IF;

  -- Créer le profil utilisateur
  INSERT INTO public.users (
    auth_user_id,
    name,
    email,
    role,
    is_active,
    created_at,
    updated_at
  )
  SELECT 
    au.id,
    COALESCE(au.raw_user_meta_data->>'name', split_part(au.email, '@', 1)),
    au.email,
    COALESCE(au.raw_user_meta_data->>'role', 'sales')::user_role,
    true,
    NOW(),
    NOW()
  FROM auth.users au
  WHERE au.id = auth_user_uuid;

  RETURN true;
EXCEPTION
  WHEN OTHERS THEN
    RAISE LOG 'Erreur lors de la création du profil pour %: %', auth_user_uuid, SQLERRM;
    RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- CORRECTION DES UTILISATEURS EXISTANTS
-- =====================================================

-- Créer les profils manquants pour les utilisateurs auth existants
DO $$
DECLARE
  auth_user RECORD;
BEGIN
  FOR auth_user IN 
    SELECT id, email, raw_user_meta_data 
    FROM auth.users 
    WHERE id NOT IN (SELECT auth_user_id FROM public.users WHERE auth_user_id IS NOT NULL)
  LOOP
    BEGIN
      INSERT INTO public.users (
        auth_user_id,
        name,
        email,
        role,
        is_active,
        created_at,
        updated_at
      ) VALUES (
        auth_user.id,
        COALESCE(auth_user.raw_user_meta_data->>'name', split_part(auth_user.email, '@', 1)),
        auth_user.email,
        COALESCE(auth_user.raw_user_meta_data->>'role', 'sales')::user_role,
        true,
        NOW(),
        NOW()
      );
      
      RAISE LOG 'Profil créé pour l''utilisateur: %', auth_user.email;
    EXCEPTION
      WHEN OTHERS THEN
        RAISE LOG 'Erreur lors de la création du profil pour %: %', auth_user.email, SQLERRM;
    END;
  END LOOP;
END $$;

-- =====================================================
-- AMÉLIORATION DE LA GESTION D'ERREUR
-- =====================================================

-- Fonction pour diagnostiquer les problèmes de création d'utilisateurs
CREATE OR REPLACE FUNCTION diagnose_user_creation_issues()
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
  
  -- Profils sans utilisateur auth
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
-- INDEX POUR AMÉLIORER LES PERFORMANCES
-- =====================================================

-- Index pour améliorer les recherches par auth_user_id
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON public.users(auth_user_id);

-- Index pour les recherches par email
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);

-- =====================================================
-- COMMENTAIRES
-- =====================================================

COMMENT ON FUNCTION public.handle_new_user() IS 'Fonction corrigée pour créer automatiquement un profil utilisateur lors de l''inscription';
COMMENT ON FUNCTION create_user_profile_if_missing(UUID) IS 'Fonction pour créer manuellement un profil utilisateur manquant';
COMMENT ON FUNCTION diagnose_user_creation_issues() IS 'Fonction de diagnostic pour identifier les problèmes de création d''utilisateurs'; 