-- =====================================================
-- ANALYSE TABLE TASKS EXISTANTE
-- =====================================================

-- ÉTAPE 1: Structure de la table
SELECT 'STRUCTURE DE LA TABLE TASKS' as info;

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default,
  character_maximum_length
FROM information_schema.columns 
WHERE table_name = 'tasks' 
ORDER BY ordinal_position;

-- ÉTAPE 2: Contraintes et clés
SELECT 'CONTRAINTES ET CLÉS' as info;

SELECT 
  tc.constraint_name,
  tc.constraint_type,
  kcu.column_name,
  ccu.table_name AS foreign_table_name,
  ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
LEFT JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.table_name = 'tasks'
ORDER BY tc.constraint_type, kcu.ordinal_position;

-- ÉTAPE 3: Index existants
SELECT 'INDEX EXISTANTS' as info;

SELECT 
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename = 'tasks';

-- ÉTAPE 4: Politiques RLS
SELECT 'POLITIQUES RLS' as info;

SELECT 
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies 
WHERE tablename = 'tasks';

-- ÉTAPE 5: Données d'exemple (5 dernières tâches)
SELECT 'DONNÉES D\'EXEMPLE' as info;

SELECT * FROM tasks ORDER BY created_at DESC LIMIT 5;

-- ÉTAPE 6: Types ENUM personnalisés (si existants)
SELECT 'TYPES ENUM' as info;

SELECT 
  t.typname,
  e.enumlabel
FROM pg_type t
JOIN pg_enum e ON t.oid = e.enumtypid
JOIN pg_catalog.pg_namespace n ON n.oid = t.typnamespace
WHERE n.nspname = 'public'
AND t.typname IN (
  SELECT DISTINCT udt_name 
  FROM information_schema.columns 
  WHERE table_name = 'tasks' 
  AND udt_name LIKE '%enum%'
);

SELECT 'ANALYSE TERMINÉE - VÉRIFIER LES RÉSULTATS CI-DESSUS' as status;
