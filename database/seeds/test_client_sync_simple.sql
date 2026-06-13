-- =====================================================
-- TEST SIMPLE DE SYNCHRONISATION CLIENTS
-- =====================================================

-- Test 1: Vérifier que les fonctions existent
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'create_client_from_bot_one_record') THEN
    RAISE NOTICE '✓ Fonction create_client_from_bot_one_record existe';
  ELSE
    RAISE WARNING '✗ Fonction create_client_from_bot_one_record manquante';
  END IF;
  
  IF EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'create_client_from_byw_record') THEN
    RAISE NOTICE '✓ Fonction create_client_from_byw_record existe';
  ELSE
    RAISE WARNING '✗ Fonction create_client_from_byw_record manquante';
  END IF;
END $$;

-- Test 2: Créer un record Bot One et vérifier la synchronisation
DO $$
DECLARE
  test_record_id UUID;
  client_count INTEGER;
  client_record RECORD;
BEGIN
  -- Créer un record de test
  INSERT INTO crm_bot_one_records (
    data,
    status
  ) VALUES (
    '{"Nom de l''entreprise": "Test Bot One", "Nom contact": "Contact Bot One", "Email": "botone@test.com", "Téléphone": "0123456789", "Site web": "https://botone.test.com", "Statut": "prospect"}'::jsonb,
    'prospect'
  ) RETURNING id INTO test_record_id;
  
  RAISE NOTICE 'Record Bot One créé avec ID: %', test_record_id;
  
  -- Vérifier qu'un client a été créé
  SELECT COUNT(*) INTO client_count 
  FROM clients 
  WHERE name = 'Test Bot One';
  
  IF client_count > 0 THEN
    RAISE NOTICE '✓ Synchronisation Bot One -> Client réussie';
    
    -- Afficher les détails du client créé
    SELECT * INTO client_record FROM clients WHERE name = 'Test Bot One';
    RAISE NOTICE 'Client créé: % - % - %', client_record.name, client_record.email, client_record.status;
  ELSE
    RAISE WARNING '✗ Synchronisation Bot One -> Client échouée';
  END IF;
  
  -- Nettoyer
  DELETE FROM crm_bot_one_records WHERE id = test_record_id;
  DELETE FROM clients WHERE name = 'Test Bot One';
  
  RAISE NOTICE 'Test Bot One terminé et nettoyé';
END $$;

-- Test 3: Créer un record BYW et vérifier la synchronisation
DO $$
DECLARE
  test_record_id UUID;
  client_count INTEGER;
  client_record RECORD;
BEGIN
  -- Créer un record de test
  INSERT INTO crm_byw_records (
    company_name,
    contact_name,
    email,
    phone,
    presentation_envoye,
    rdv,
    beta_testeur,
    demo,
    client,
    perdu
  ) VALUES (
    'Test BYW Company',
    'Contact BYW',
    'byw@test.com',
    '0987654321',
    'Non',
    'Non planifié',
    'Non proposé',
    'Non programmée',
    'Prospect',
    'Non'
  ) RETURNING id INTO test_record_id;
  
  RAISE NOTICE 'Record BYW créé avec ID: %', test_record_id;
  
  -- Vérifier qu'un client a été créé
  SELECT COUNT(*) INTO client_count 
  FROM clients 
  WHERE name = 'Test BYW Company';
  
  IF client_count > 0 THEN
    RAISE NOTICE '✓ Synchronisation BYW -> Client réussie';
    
    -- Afficher les détails du client créé
    SELECT * INTO client_record FROM clients WHERE name = 'Test BYW Company';
    RAISE NOTICE 'Client créé: % - % - %', client_record.name, client_record.email, client_record.status;
  ELSE
    RAISE WARNING '✗ Synchronisation BYW -> Client échouée';
  END IF;
  
  -- Nettoyer
  DELETE FROM crm_byw_records WHERE id = test_record_id;
  DELETE FROM clients WHERE name = 'Test BYW Company';
  
  RAISE NOTICE 'Test BYW terminé et nettoyé';
END $$;

-- Résumé final
SELECT 
  'TESTS DE SYNCHRONISATION TERMINÉS' as status,
  'Vérifiez les messages ci-dessus pour voir les résultats' as message,
  NOW() as test_time;
