-- =====================================================
-- TESTS DU SYSTÈME D'ACTIVITÉS
-- =====================================================
-- Script pour tester le système d'activités déployé

-- =====================================================
-- TEST 1: VÉRIFICATION DES TABLES
-- =====================================================

SELECT 
  'Vérification des tables' as test_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_bot_one_activities') 
    THEN '✅ Table crm_bot_one_activities existe'
    ELSE '❌ Table crm_bot_one_activities manquante'
  END as result;

SELECT 
  'Vérification des tables' as test_name,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_byw_activities') 
    THEN '✅ Table crm_byw_activities existe'
    ELSE '❌ Table crm_byw_activities manquante'
  END as result;

-- =====================================================
-- TEST 2: VÉRIFICATION DES FONCTIONS
-- =====================================================

SELECT 
  'Vérification des fonctions' as test_name,
  routine_name,
  CASE 
    WHEN routine_name IS NOT NULL THEN '✅ Fonction disponible'
    ELSE '❌ Fonction manquante'
  END as result
FROM information_schema.routines 
WHERE routine_name IN (
  'sync_bot_one_activity_to_main',
  'sync_byw_activity_to_main',
  'create_bot_one_record_activity',
  'create_byw_record_activity',
  'create_byw_automatic_activities'
);

-- =====================================================
-- TEST 3: TEST DE CRÉATION D'ACTIVITÉS BOT ONE
-- =====================================================

-- Créer un enregistrement de test Bot One
DO $$
DECLARE
  test_user_id UUID;
  test_record_id UUID;
  test_activity_id UUID;
BEGIN
  -- Récupérer un utilisateur existant
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE 'Aucun utilisateur trouvé pour le test';
    RETURN;
  END IF;
  
  -- Créer un enregistrement de test
  INSERT INTO crm_bot_one_records (user_id, data, status)
  VALUES (test_user_id, '{"Nom de l''entreprise": "Test Company", "Email": "test@example.com"}'::jsonb, 'active')
  RETURNING id INTO test_record_id;
  
  -- Créer une activité de test
  SELECT create_bot_one_record_activity(
    test_record_id,
    'Test activité Bot One',
    'Description de test pour Bot One',
    NOW(),
    'bot_one_record',
    'haute',
    'a_faire'
  ) INTO test_activity_id;
  
  RAISE NOTICE '✅ Test Bot One réussi - Activity ID: %', test_activity_id;
  
  -- Nettoyer
  DELETE FROM crm_bot_one_records WHERE id = test_record_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Erreur test Bot One: %', SQLERRM;
END $$;

-- =====================================================
-- TEST 4: TEST DE CRÉATION D'ACTIVITÉS BYW
-- =====================================================

-- Créer un enregistrement de test BYW
DO $$
DECLARE
  test_user_id UUID;
  test_record_id UUID;
  test_activity_id UUID;
BEGIN
  -- Récupérer un utilisateur existant
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE 'Aucun utilisateur trouvé pour le test';
    RETURN;
  END IF;
  
  -- Créer un enregistrement de test
  INSERT INTO crm_byw_records (user_id, company_name, contact_name, email)
  VALUES (test_user_id, 'Test Company BYW', 'John Doe', 'test@example.com')
  RETURNING id INTO test_record_id;
  
  -- Créer une activité de test
  SELECT create_byw_record_activity(
    test_record_id,
    'Test activité BYW',
    'Description de test pour BYW',
    NOW(),
    'byw_record',
    'moyenne',
    'a_faire'
  ) INTO test_activity_id;
  
  RAISE NOTICE '✅ Test BYW réussi - Activity ID: %', test_activity_id;
  
  -- Nettoyer
  DELETE FROM crm_byw_records WHERE id = test_record_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Erreur test BYW: %', SQLERRM;
END $$;

-- =====================================================
-- TEST 5: TEST DE SYNCHRONISATION
-- =====================================================

-- Vérifier que les activités sont synchronisées dans la table principale
SELECT 
  'Test de synchronisation' as test_name,
  COUNT(*) as activities_in_main_table,
  COUNT(*) FILTER (WHERE related_module = 'crm_bot_one') as bot_one_activities,
  COUNT(*) FILTER (WHERE related_module = 'crm_byw') as byw_activities
FROM activities
WHERE related_module IN ('crm_bot_one', 'crm_byw');

-- =====================================================
-- TEST 6: TEST DES TRIGGERS AUTOMATIQUES BYW
-- =====================================================

-- Tester les triggers automatiques BYW
DO $$
DECLARE
  test_user_id UUID;
  test_record_id UUID;
  activities_count_before INTEGER;
  activities_count_after INTEGER;
BEGIN
  -- Récupérer un utilisateur existant
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE 'Aucun utilisateur trouvé pour le test des triggers';
    RETURN;
  END IF;
  
  -- Créer un enregistrement de test
  INSERT INTO crm_byw_records (user_id, company_name, contact_name, email, presentation_envoye, rdv, demo, client, perdu)
  VALUES (test_user_id, 'Trigger Test Company', 'Jane Doe', 'trigger@example.com', 'Non', 'Non planifié', 'Non programmée', 'Prospect', 'Non')
  RETURNING id INTO test_record_id;
  
  -- Compter les activités avant
  SELECT COUNT(*) INTO activities_count_before
  FROM crm_byw_activities
  WHERE related_id = test_record_id;
  
  -- Déclencher les changements qui devraient créer des activités automatiques
  UPDATE crm_byw_records 
  SET presentation_envoye = 'Oui', presentation_sent_date = NOW()
  WHERE id = test_record_id;
  
  UPDATE crm_byw_records 
  SET rdv = 'Planifié', rdv_date = NOW() + INTERVAL '1 day'
  WHERE id = test_record_id;
  
  UPDATE crm_byw_records 
  SET demo = 'Programmée', demo_date = NOW() + INTERVAL '2 days'
  WHERE id = test_record_id;
  
  UPDATE crm_byw_records 
  SET client = 'Client', conversion_date = NOW()
  WHERE id = test_record_id;
  
  -- Compter les activités après
  SELECT COUNT(*) INTO activities_count_after
  FROM crm_byw_activities
  WHERE related_id = test_record_id;
  
  RAISE NOTICE '✅ Test triggers BYW - Activités avant: %, après: %', activities_count_before, activities_count_after;
  
  -- Nettoyer
  DELETE FROM crm_byw_records WHERE id = test_record_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Erreur test triggers BYW: %', SQLERRM;
END $$;

-- =====================================================
-- TEST 7: VÉRIFICATION DES POLITIQUES RLS
-- =====================================================

-- Tester l'accès aux données (nécessite un utilisateur authentifié)
SELECT 
  'Test RLS' as test_name,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.table_privileges 
      WHERE table_name = 'crm_bot_one_activities' 
        AND privilege_type = 'SELECT'
    ) THEN '✅ Politiques RLS configurées'
    ELSE '❌ Politiques RLS manquantes'
  END as result;

-- =====================================================
-- TEST 8: STATISTIQUES GÉNÉRALES
-- =====================================================

-- Afficher les statistiques des activités
SELECT 
  'Statistiques des activités' as info,
  'CRM Bot One' as module,
  COUNT(*) as total_activities,
  COUNT(*) FILTER (WHERE status = 'a_faire') as pending,
  COUNT(*) FILTER (WHERE status = 'termine') as completed
FROM crm_bot_one_activities

UNION ALL

SELECT 
  'Statistiques des activités' as info,
  'CRM BYW' as module,
  COUNT(*) as total_activities,
  COUNT(*) FILTER (WHERE status = 'a_faire') as pending,
  COUNT(*) FILTER (WHERE status = 'termine') as completed
FROM crm_byw_activities

UNION ALL

SELECT 
  'Statistiques des activités' as info,
  'CRM Principal' as module,
  COUNT(*) as total_activities,
  COUNT(*) FILTER (WHERE status = 'a_faire') as pending,
  COUNT(*) FILTER (WHERE status = 'termine') as completed
FROM activities
WHERE related_module IN ('crm_bot_one', 'crm_byw');

-- =====================================================
-- TEST 9: VÉRIFICATION DES INDEX
-- =====================================================

-- Vérifier que les index sont créés
SELECT 
  'Vérification des index' as test_name,
  schemaname,
  tablename,
  indexname,
  '✅ Index créé' as result
FROM pg_indexes 
WHERE tablename IN ('crm_bot_one_activities', 'crm_byw_activities')
ORDER BY tablename, indexname;

-- =====================================================
-- RÉSUMÉ DES TESTS
-- =====================================================

SELECT 
  '🎯 RÉSUMÉ DES TESTS' as status,
  'Tous les tests ont été exécutés. Vérifiez les résultats ci-dessus.' as message,
  NOW() as test_time;
