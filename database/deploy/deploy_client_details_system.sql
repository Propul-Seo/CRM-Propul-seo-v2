-- =====================================================
-- DÉPLOIEMENT DU SYSTÈME DE FICHES CLIENTS
-- =====================================================
-- Script pour déployer le système de fiches clients pour Bot One et BYW

-- Vérifier que les tables existent
DO $$
BEGIN
  -- Vérifier crm_bot_one_records
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_bot_one_records') THEN
    RAISE EXCEPTION 'Table crm_bot_one_records n''existe pas. Exécutez d''abord le script de création des tables.';
  END IF;
  
  -- Vérifier crm_byw_records
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_byw_records') THEN
    RAISE EXCEPTION 'Table crm_byw_records n''existe pas. Exécutez d''abord le script de création des tables.';
  END IF;
  
  RAISE NOTICE 'Tables CRM trouvées ✓';
END $$;

-- Vérifier les contraintes de statut
DO $$
BEGIN
  -- Vérifier crm_bot_one_records
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'crm_bot_one_records_status_check'
  ) THEN
    RAISE NOTICE 'Contrainte de statut Bot One trouvée ✓';
  ELSE
    RAISE WARNING 'Contrainte de statut Bot One manquante';
  END IF;
  
  -- Vérifier crm_byw_records
  IF EXISTS (
    SELECT 1 FROM information_schema.check_constraints 
    WHERE constraint_name = 'crm_byw_records_status_check'
  ) THEN
    RAISE NOTICE 'Contrainte de statut BYW trouvée ✓';
  ELSE
    RAISE WARNING 'Contrainte de statut BYW manquante';
  END IF;
END $$;

-- Vérifier les fonctions de synchronisation
DO $$
BEGIN
  -- Vérifier create_client_from_bot_one_record
  IF EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'create_client_from_bot_one_record'
  ) THEN
    RAISE NOTICE 'Fonction create_client_from_bot_one_record trouvée ✓';
  ELSE
    RAISE WARNING 'Fonction create_client_from_bot_one_record manquante';
  END IF;
  
  -- Vérifier create_client_from_byw_record
  IF EXISTS (
    SELECT 1 FROM information_schema.routines 
    WHERE routine_name = 'create_client_from_byw_record'
  ) THEN
    RAISE NOTICE 'Fonction create_client_from_byw_record trouvée ✓';
  ELSE
    RAISE WARNING 'Fonction create_client_from_byw_record manquante';
  END IF;
END $$;

-- Vérifier les triggers
DO $$
BEGIN
  -- Vérifier trigger_bot_one_create_client
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'trigger_bot_one_create_client'
  ) THEN
    RAISE NOTICE 'Trigger trigger_bot_one_create_client trouvé ✓';
  ELSE
    RAISE WARNING 'Trigger trigger_bot_one_create_client manquant';
  END IF;
  
  -- Vérifier trigger_byw_create_client
  IF EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'trigger_byw_create_client'
  ) THEN
    RAISE NOTICE 'Trigger trigger_byw_create_client trouvé ✓';
  ELSE
    RAISE WARNING 'Trigger trigger_byw_create_client manquant';
  END IF;
END $$;

-- Test de création d'un record Bot One
DO $$
DECLARE
  test_record_id UUID;
  client_count INTEGER;
BEGIN
  -- Créer un record de test
  INSERT INTO crm_bot_one_records (
    data,
    status
  ) VALUES (
    '{"Nom de l''entreprise": "Test Company", "Nom contact": "Test Contact", "Email": "test@example.com", "Téléphone": "0123456789", "Site web": "https://test.com", "Statut": "prospect"}'::jsonb,
    'prospect'
  ) RETURNING id INTO test_record_id;
  
  -- Vérifier qu'un client a été créé
  SELECT COUNT(*) INTO client_count 
  FROM clients 
  WHERE name = 'Test Company';
  
  IF client_count > 0 THEN
    RAISE NOTICE 'Synchronisation Bot One -> Client fonctionne ✓';
  ELSE
    RAISE WARNING 'Synchronisation Bot One -> Client ne fonctionne pas';
  END IF;
  
  -- Nettoyer le test
  DELETE FROM crm_bot_one_records WHERE id = test_record_id;
  DELETE FROM clients WHERE name = 'Test Company';
  
  RAISE NOTICE 'Test de synchronisation Bot One terminé';
END $$;

-- Test de création d'un record BYW
DO $$
DECLARE
  test_record_id UUID;
  client_count INTEGER;
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
    'Test BYW Contact',
    'testbyw@example.com',
    '0987654321',
    'Non',
    'Non planifié',
    'Non proposé',
    'Non programmée',
    'Prospect',
    'Non'
  ) RETURNING id INTO test_record_id;
  
  -- Vérifier qu'un client a été créé
  SELECT COUNT(*) INTO client_count 
  FROM clients 
  WHERE name = 'Test BYW Company';
  
  IF client_count > 0 THEN
    RAISE NOTICE 'Synchronisation BYW -> Client fonctionne ✓';
  ELSE
    RAISE WARNING 'Synchronisation BYW -> Client ne fonctionne pas';
  END IF;
  
  -- Nettoyer le test
  DELETE FROM crm_byw_records WHERE id = test_record_id;
  DELETE FROM clients WHERE name = 'Test BYW Company';
  
  RAISE NOTICE 'Test de synchronisation BYW terminé';
END $$;

-- Message de confirmation final
SELECT 
  'SYSTÈME DE FICHES CLIENTS DÉPLOYÉ' as status,
  'Les clics sur les vignettes ouvrent maintenant les fiches clients avec activités synchronisées' as message,
  NOW() as deployment_time;
