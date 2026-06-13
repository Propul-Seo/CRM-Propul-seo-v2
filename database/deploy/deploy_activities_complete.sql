-- =====================================================
-- DÉPLOIEMENT COMPLET DU SYSTÈME D'ACTIVITÉS
-- =====================================================

-- ÉTAPE 1: Créer les tables d'activités
\i create_activities_tables_fixed.sql

-- ÉTAPE 2: Créer les fonctions de synchronisation
\i create_activities_sync_functions_fixed.sql

-- ÉTAPE 3: Test de création d'activités
DO $$
DECLARE
  test_record_id UUID;
  activity_id UUID;
  client_count INTEGER;
BEGIN
  -- Créer un record de test Bot One
  INSERT INTO crm_bot_one_records (
    data,
    status
  ) VALUES (
    '{"Nom de l''entreprise": "Test Activities Bot One", "Nom contact": "Contact Test", "Email": "test@botone.com", "Téléphone": "0123456789", "Site web": "https://botone.test.com", "Statut": "prospect"}'::jsonb,
    'prospect'
  ) RETURNING id INTO test_record_id;
  
  -- Créer une activité
  SELECT create_bot_one_activity(
    test_record_id,
    'Test d''activité Bot One',
    'Description de test',
    NOW(),
    'call',
    'scheduled'
  ) INTO activity_id;
  
  -- Vérifier que l'activité a été créée
  IF activity_id IS NOT NULL THEN
    RAISE NOTICE '✓ Activité Bot One créée avec ID: %', activity_id;
  ELSE
    RAISE WARNING '✗ Échec de création d''activité Bot One';
  END IF;
  
  -- Vérifier la synchronisation avec le CRM Principal
  SELECT COUNT(*) INTO client_count 
  FROM activities 
  WHERE title = 'Test d''activité Bot One';
  
  IF client_count > 0 THEN
    RAISE NOTICE '✓ Synchronisation avec CRM Principal réussie';
  ELSE
    RAISE WARNING '✗ Synchronisation avec CRM Principal échouée';
  END IF;
  
  -- Nettoyer
  DELETE FROM crm_bot_one_records WHERE id = test_record_id;
  DELETE FROM activities WHERE title = 'Test d''activité Bot One';
  
  RAISE NOTICE 'Test Bot One terminé et nettoyé';
END $$;

-- ÉTAPE 4: Test BYW
DO $$
DECLARE
  test_record_id UUID;
  activity_id UUID;
  client_count INTEGER;
BEGIN
  -- Créer un record de test BYW
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
    'Test Activities BYW',
    'Contact BYW Test',
    'test@byw.com',
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
    'Test d''activité BYW',
    'Description de test BYW',
    NOW(),
    'meeting',
    'scheduled'
  ) INTO activity_id;
  
  -- Vérifier que l'activité a été créée
  IF activity_id IS NOT NULL THEN
    RAISE NOTICE '✓ Activité BYW créée avec ID: %', activity_id;
  ELSE
    RAISE WARNING '✗ Échec de création d''activité BYW';
  END IF;
  
  -- Vérifier la synchronisation avec le CRM Principal
  SELECT COUNT(*) INTO client_count 
  FROM activities 
  WHERE title = 'Test d''activité BYW';
  
  IF client_count > 0 THEN
    RAISE NOTICE '✓ Synchronisation BYW avec CRM Principal réussie';
  ELSE
    RAISE WARNING '✗ Synchronisation BYW avec CRM Principal échouée';
  END IF;
  
  -- Nettoyer
  DELETE FROM crm_byw_records WHERE id = test_record_id;
  DELETE FROM activities WHERE title = 'Test d''activité BYW';
  
  RAISE NOTICE 'Test BYW terminé et nettoyé';
END $$;

-- Message de confirmation final
SELECT 
  'SYSTÈME D''ACTIVITÉS DÉPLOYÉ' as status,
  'Les activités Bot One et BYW se synchronisent maintenant avec le CRM Principal' as message,
  NOW() as deployment_time;
