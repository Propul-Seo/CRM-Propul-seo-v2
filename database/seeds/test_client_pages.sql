-- =====================================================
-- TEST DES PAGES CLIENTS
-- =====================================================

-- Vérifier que les tables d'activités existent
SELECT 
  'TABLES D''ACTIVITÉS' as info,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_bot_one_activities') 
    THEN '✓ Table crm_bot_one_activities existe'
    ELSE '✗ Table crm_bot_one_activities manquante'
  END as status;

SELECT 
  'TABLES D''ACTIVITÉS' as info,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_byw_activities') 
    THEN '✓ Table crm_byw_activities existe'
    ELSE '✗ Table crm_byw_activities manquante'
  END as status;

-- Vérifier que les fonctions existent
SELECT 
  'FONCTIONS' as info,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'create_bot_one_activity') 
    THEN '✓ Fonction create_bot_one_activity existe'
    ELSE '✗ Fonction create_bot_one_activity manquante'
  END as status;

SELECT 
  'FONCTIONS' as info,
  CASE 
    WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'create_byw_activity') 
    THEN '✓ Fonction create_byw_activity existe'
    ELSE '✗ Fonction create_byw_activity manquante'
  END as status;

-- Test de création d'activité Bot One
DO $$
DECLARE
  test_record_id UUID;
  activity_id UUID;
BEGIN
  -- Créer un record de test
  INSERT INTO crm_bot_one_records (
    data,
    status
  ) VALUES (
    '{"Nom de l''entreprise": "Test Page Client", "Nom contact": "Contact Test", "Email": "test@page.com", "Téléphone": "0123456789", "Site web": "https://test.com", "Statut": "prospect"}'::jsonb,
    'prospect'
  ) RETURNING id INTO test_record_id;
  
  -- Créer une activité
  SELECT create_bot_one_activity(
    test_record_id,
    'Test page client Bot One',
    'Description de test pour la page client',
    NOW(),
    'call',
    'scheduled'
  ) INTO activity_id;
  
  IF activity_id IS NOT NULL THEN
    RAISE NOTICE '✓ Test page client Bot One réussi - ID activité: %', activity_id;
  ELSE
    RAISE WARNING '✗ Test page client Bot One échoué';
  END IF;
  
  -- Nettoyer
  DELETE FROM crm_bot_one_records WHERE id = test_record_id;
  
  RAISE NOTICE 'Test page client Bot One terminé';
END $$;

-- Test de création d'activité BYW
DO $$
DECLARE
  test_record_id UUID;
  activity_id UUID;
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
    'Test Page Client BYW',
    'Contact Test BYW',
    'test@bywpage.com',
    '0987654321',
    'Non',
    'Non planifié',
    'Non proposé',
    'Non programmée',
    'Prospect',
    'Non'
  ) RETURNING id INTO test_record_id;
  
  -- Créer une activité
  SELECT create_byw_activity(
    test_record_id,
    'Test page client BYW',
    'Description de test pour la page client BYW',
    NOW(),
    'meeting',
    'scheduled'
  ) INTO activity_id;
  
  IF activity_id IS NOT NULL THEN
    RAISE NOTICE '✓ Test page client BYW réussi - ID activité: %', activity_id;
  ELSE
    RAISE WARNING '✗ Test page client BYW échoué';
  END IF;
  
  -- Nettoyer
  DELETE FROM crm_byw_records WHERE id = test_record_id;
  
  RAISE NOTICE 'Test page client BYW terminé';
END $$;

-- Message final
SELECT 
  'PAGES CLIENTS PRÊTES' as status,
  'Les fiches clients s''ouvrent maintenant en pages complètes' as message,
  NOW() as test_time;
