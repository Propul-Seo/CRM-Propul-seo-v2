-- =====================================================
-- TESTS DU SYSTÈME DE SYNCHRONISATION CLIENTS
-- =====================================================
-- Script pour tester la synchronisation automatique des clients

-- =====================================================
-- TEST 1: VÉRIFICATION DES FONCTIONS
-- =====================================================

SELECT 
  'Vérification des fonctions de synchronisation' as test_name,
  routine_name,
  CASE 
    WHEN routine_name IS NOT NULL THEN '✅ Fonction disponible'
    ELSE '❌ Fonction manquante'
  END as result
FROM information_schema.routines 
WHERE routine_name IN (
  'create_client_from_bot_one_record',
  'create_client_from_byw_record',
  'update_client_from_bot_one_record',
  'update_client_from_byw_record',
  'trigger_create_client_from_bot_one',
  'trigger_create_client_from_byw',
  'sync_all_bot_one_to_clients',
  'sync_all_byw_to_clients'
);

-- =====================================================
-- TEST 2: TEST DE CRÉATION CLIENT BOT ONE
-- =====================================================

DO $$
DECLARE
  test_user_id UUID;
  test_record_id UUID;
  test_client_id UUID;
  clients_count_before INTEGER;
  clients_count_after INTEGER;
BEGIN
  -- Récupérer un utilisateur existant
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE 'Aucun utilisateur trouvé pour le test Bot One';
    RETURN;
  END IF;
  
  -- Compter les clients avant
  SELECT COUNT(*) INTO clients_count_before FROM clients WHERE user_id = test_user_id;
  
  -- Créer un enregistrement de test Bot One
  INSERT INTO crm_bot_one_records (user_id, data, status)
  VALUES (
    test_user_id, 
    '{
      "Nom de l''entreprise": "Test Company Bot One",
      "Nom contact": "John Doe",
      "Email": "john@testcompany.com",
      "Téléphone": "0123456789",
      "Type de contact": "entreprise"
    }'::jsonb, 
    'active'
  ) RETURNING id INTO test_record_id;
  
  -- Attendre un peu pour que le trigger se déclenche
  PERFORM pg_sleep(1);
  
  -- Compter les clients après
  SELECT COUNT(*) INTO clients_count_after FROM clients WHERE user_id = test_user_id;
  
  -- Vérifier qu'un client a été créé
  IF clients_count_after > clients_count_before THEN
    RAISE NOTICE '✅ Test Bot One réussi - Client créé automatiquement';
    
    -- Récupérer l'ID du client créé
    SELECT id INTO test_client_id 
    FROM clients 
    WHERE user_id = test_user_id 
      AND name = 'Test Company Bot One'
    ORDER BY created_at DESC 
    LIMIT 1;
    
    RAISE NOTICE 'Client ID créé: %', test_client_id;
  ELSE
    RAISE NOTICE '❌ Test Bot One échoué - Aucun client créé';
  END IF;
  
  -- Nettoyer
  DELETE FROM crm_bot_one_records WHERE id = test_record_id;
  DELETE FROM clients WHERE id = test_client_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Erreur test Bot One: %', SQLERRM;
END $$;

-- =====================================================
-- TEST 3: TEST DE CRÉATION CLIENT BYW
-- =====================================================

DO $$
DECLARE
  test_user_id UUID;
  test_record_id UUID;
  test_client_id UUID;
  clients_count_before INTEGER;
  clients_count_after INTEGER;
BEGIN
  -- Récupérer un utilisateur existant
  SELECT id INTO test_user_id FROM auth.users LIMIT 1;
  
  IF test_user_id IS NULL THEN
    RAISE NOTICE 'Aucun utilisateur trouvé pour le test BYW';
    RETURN;
  END IF;
  
  -- Compter les clients avant
  SELECT COUNT(*) INTO clients_count_before FROM clients WHERE user_id = test_user_id;
  
  -- Créer un enregistrement de test BYW
  INSERT INTO crm_byw_records (user_id, company_name, contact_name, email, phone, client)
  VALUES (
    test_user_id,
    'Test Company BYW',
    'Jane Smith',
    'jane@testcompany.com',
    '0987654321',
    'Prospect'
  ) RETURNING id INTO test_record_id;
  
  -- Attendre un peu pour que le trigger se déclenche
  PERFORM pg_sleep(1);
  
  -- Compter les clients après
  SELECT COUNT(*) INTO clients_count_after FROM clients WHERE user_id = test_user_id;
  
  -- Vérifier qu'un client a été créé
  IF clients_count_after > clients_count_before THEN
    RAISE NOTICE '✅ Test BYW réussi - Client créé automatiquement';
    
    -- Récupérer l'ID du client créé
    SELECT id INTO test_client_id 
    FROM clients 
    WHERE user_id = test_user_id 
      AND name = 'Test Company BYW'
    ORDER BY created_at DESC 
    LIMIT 1;
    
    RAISE NOTICE 'Client ID créé: %', test_client_id;
  ELSE
    RAISE NOTICE '❌ Test BYW échoué - Aucun client créé';
  END IF;
  
  -- Nettoyer
  DELETE FROM crm_byw_records WHERE id = test_record_id;
  DELETE FROM clients WHERE id = test_client_id;
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE '❌ Erreur test BYW: %', SQLERRM;
END $$;

-- =====================================================
-- TEST 4: TEST DE SYNCHRONISATION MANUELLE
-- =====================================================

-- Tester la synchronisation manuelle Bot One
SELECT 
  'Synchronisation manuelle Bot One' as test_name,
  records_processed,
  clients_created,
  clients_updated
FROM sync_all_bot_one_to_clients();

-- Tester la synchronisation manuelle BYW
SELECT 
  'Synchronisation manuelle BYW' as test_name,
  records_processed,
  clients_created,
  clients_updated
FROM sync_all_byw_to_clients();

-- =====================================================
-- TEST 5: VÉRIFICATION DES TRIGGERS
-- =====================================================

-- Vérifier que les triggers existent
SELECT 
  'Vérification des triggers' as test_name,
  trigger_name,
  event_object_table,
  CASE 
    WHEN trigger_name IS NOT NULL THEN '✅ Trigger actif'
    ELSE '❌ Trigger manquant'
  END as result
FROM information_schema.triggers 
WHERE trigger_name IN (
  'trigger_bot_one_create_client',
  'trigger_byw_create_client'
);

-- =====================================================
-- TEST 6: STATISTIQUES GÉNÉRALES
-- =====================================================

-- Afficher les statistiques des clients créés
SELECT 
  'Statistiques des clients' as info,
  'Total clients' as metric,
  COUNT(*) as value
FROM clients

UNION ALL

SELECT 
  'Statistiques des clients' as info,
  'Clients Bot One' as metric,
  COUNT(*) as value
FROM clients 
WHERE sector LIKE '%Bot One%' OR sector LIKE '%entreprise%'

UNION ALL

SELECT 
  'Statistiques des clients' as info,
  'Clients BYW' as metric,
  COUNT(*) as value
FROM clients 
WHERE sector LIKE '%BYW%'

UNION ALL

SELECT 
  'Statistiques des clients' as info,
  'Clients prospects' as metric,
  COUNT(*) as value
FROM clients 
WHERE status = 'prospect';

-- =====================================================
-- TEST 7: VÉRIFICATION DE L'INTÉGRITÉ
-- =====================================================

-- Vérifier qu'il n'y a pas de doublons
SELECT 
  'Vérification intégrité' as test_name,
  'Doublons clients' as check_type,
  COUNT(*) as duplicate_count
FROM (
  SELECT name, email, user_id, COUNT(*)
  FROM clients 
  GROUP BY name, email, user_id
  HAVING COUNT(*) > 1
) duplicates;

-- Vérifier les clients sans email valide
SELECT 
  'Vérification intégrité' as test_name,
  'Clients sans email valide' as check_type,
  COUNT(*) as count
FROM clients 
WHERE email IS NULL OR email = '' OR email = 'contact@example.com';

-- =====================================================
-- RÉSUMÉ DES TESTS
-- =====================================================

SELECT 
  '🎯 RÉSUMÉ DES TESTS DE SYNCHRONISATION CLIENTS' as status,
  'Tous les tests ont été exécutés. Vérifiez les résultats ci-dessus.' as message,
  NOW() as test_time;
