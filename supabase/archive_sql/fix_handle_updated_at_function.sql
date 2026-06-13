-- =====================================================
-- CRÉATION DE LA FONCTION handle_updated_at MANQUANTE
-- =====================================================
-- Cette fonction est nécessaire pour les triggers updated_at

-- 1. Créer la fonction handle_updated_at si elle n'existe pas
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Vérifier que la fonction a été créée
SELECT 
  'Fonction handle_updated_at créée' as info,
  routine_name,
  routine_type
FROM information_schema.routines 
WHERE routine_name = 'handle_updated_at' 
  AND routine_schema = 'public';

-- 3. Tester la fonction
DO $$
DECLARE
  test_result TEXT;
BEGIN
  -- Créer une table temporaire pour tester
  CREATE TEMP TABLE test_updated_at (
    id SERIAL PRIMARY KEY,
    name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );
  
  -- Créer le trigger de test
  CREATE TRIGGER test_handle_updated_at
    BEFORE UPDATE ON test_updated_at
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();
  
  -- Insérer une ligne de test
  INSERT INTO test_updated_at (name) VALUES ('Test');
  
  -- Attendre un peu
  PERFORM pg_sleep(1);
  
  -- Mettre à jour pour déclencher le trigger
  UPDATE test_updated_at SET name = 'Updated' WHERE id = 1;
  
  -- Vérifier que updated_at a été mis à jour
  SELECT 
    CASE 
      WHEN updated_at > created_at THEN '✅ Fonction handle_updated_at fonctionne'
      ELSE '❌ Fonction handle_updated_at ne fonctionne pas'
    END
  INTO test_result
  FROM test_updated_at WHERE id = 1;
  
  RAISE NOTICE '%', test_result;
  
  -- Nettoyer
  DROP TABLE test_updated_at;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Erreur lors du test: %', SQLERRM;
END $$;
