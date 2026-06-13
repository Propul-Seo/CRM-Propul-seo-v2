-- =====================================================
-- ANALYSE TABLES EXISTANTES USERS ET PROJECTS
-- =====================================================

-- ÉTAPE 1: Vérifier les tables existantes
SELECT 'TABLES EXISTANTES' as info;

SELECT 
  table_name,
  table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'profiles', 'projects', 'user', 'project')
ORDER BY table_name;

-- ÉTAPE 2: Analyser la structure de la table users (ou profiles)
SELECT 'STRUCTURE TABLE USERS' as info;

-- Essayer plusieurs noms possibles
DO $$
DECLARE
  table_name text;
  table_exists boolean;
BEGIN
  -- Essayer 'users'
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
  ) INTO table_exists;
  
  IF table_exists THEN
    table_name := 'users';
    RAISE NOTICE 'Table users trouvée';
  ELSE
    -- Essayer 'profiles'
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'profiles'
    ) INTO table_exists;
    
    IF table_exists THEN
      table_name := 'profiles';
      RAISE NOTICE 'Table profiles trouvée';
    ELSE
      RAISE NOTICE 'Aucune table users ou profiles trouvée';
      RETURN;
    END IF;
  END IF;
  
  -- Afficher la structure
  EXECUTE format('
    SELECT 
      column_name,
      data_type,
      is_nullable,
      column_default
    FROM information_schema.columns 
    WHERE table_name = %L
    ORDER BY ordinal_position
  ', table_name);
END $$;

-- ÉTAPE 3: Analyser la structure de la table projects
SELECT 'STRUCTURE TABLE PROJECTS' as info;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'projects' 
ORDER BY ordinal_position;

-- ÉTAPE 4: Vérifier les données d'exemple
SELECT 'DONNÉES UTILISATEURS' as info;

-- Essayer de récupérer des données depuis users ou profiles
DO $$
DECLARE
  table_name text;
  table_exists boolean;
BEGIN
  -- Essayer 'users'
  SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'users'
  ) INTO table_exists;
  
  IF table_exists THEN
    EXECUTE 'SELECT * FROM users LIMIT 3';
  ELSE
    -- Essayer 'profiles'
    SELECT EXISTS (
      SELECT FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_name = 'profiles'
    ) INTO table_exists;
    
    IF table_exists THEN
      EXECUTE 'SELECT * FROM profiles LIMIT 3';
    END IF;
  END IF;
END $$;

SELECT 'DONNÉES PROJETS' as info;
SELECT * FROM projects LIMIT 3;

-- ÉTAPE 5: Vérifier les politiques RLS
SELECT 'POLITIQUES RLS' as info;

SELECT 
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE tablename IN ('users', 'profiles', 'projects')
ORDER BY tablename, policyname;

SELECT 'ANALYSE TERMINÉE - VÉRIFIER LES RÉSULTATS CI-DESSUS' as status;
