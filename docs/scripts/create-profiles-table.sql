-- =====================================================
-- CRÉATION TABLE PROFILES SI ELLE N'EXISTE PAS
-- =====================================================

-- ÉTAPE 1: Vérifier si la table profiles existe
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'profiles') THEN
    -- Créer la table profiles
    CREATE TABLE profiles (
      id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
      email TEXT UNIQUE NOT NULL,
      name TEXT,
      avatar_url TEXT,
      role TEXT DEFAULT 'user',
      created_at TIMESTAMPTZ DEFAULT now(),
      updated_at TIMESTAMPTZ DEFAULT now()
    );

    -- Créer les index
    CREATE INDEX idx_profiles_email ON profiles(email);
    CREATE INDEX idx_profiles_name ON profiles(name);

    RAISE NOTICE 'Table profiles créée avec succès';
  ELSE
    RAISE NOTICE 'Table profiles existe déjà';
  END IF;
END $$;

-- ÉTAPE 2: Activer RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ÉTAPE 3: Créer les politiques RLS
DO $$
BEGIN
  -- Supprimer les anciennes politiques si elles existent
  DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
  DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;

  -- Politique : utilisateur peut voir son propre profil
  CREATE POLICY "Users can view own profile" ON profiles
    FOR SELECT USING (auth.uid() = id);

  -- Politique : utilisateur peut modifier son propre profil
  CREATE POLICY "Users can update own profile" ON profiles
    FOR UPDATE USING (auth.uid() = id);

  -- Politique : tous les utilisateurs authentifiés peuvent voir tous les profils (pour les listes)
  CREATE POLICY "Users can view all profiles" ON profiles
    FOR SELECT USING (auth.uid() IS NOT NULL);

  RAISE NOTICE 'Politiques RLS créées avec succès';
END $$;

-- ÉTAPE 4: Créer le trigger pour updated_at
CREATE OR REPLACE FUNCTION update_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS profiles_updated_at_trigger ON profiles;
CREATE TRIGGER profiles_updated_at_trigger
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_profiles_updated_at();

-- ÉTAPE 5: Créer une fonction RPC pour récupérer la liste des utilisateurs
CREATE OR REPLACE FUNCTION get_users_list()
RETURNS TABLE (
  id UUID,
  email TEXT,
  name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    p.id,
    p.email,
    p.name,
    p.avatar_url,
    p.created_at
  FROM profiles p
  ORDER BY p.name ASC NULLS LAST, p.email ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ÉTAPE 6: Vérification finale
SELECT 'VÉRIFICATION FINALE' as info;

SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name = 'profiles';

SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'profiles';

SELECT 'TABLE PROFILES PRÊTE À UTILISER !' as status;
