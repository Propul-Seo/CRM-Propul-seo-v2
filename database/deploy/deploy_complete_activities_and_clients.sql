-- =====================================================
-- DÉPLOIEMENT COMPLET : ACTIVITÉS + SYNCHRONISATION CLIENTS
-- =====================================================
-- Script principal pour déployer le système complet d'activités
-- et de synchronisation des clients entre CRM Principal, Bot One et BYW

-- =====================================================
-- ÉTAPE 1: CRÉATION DE LA FONCTION handle_updated_at
-- =====================================================

CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- ÉTAPE 2: VÉRIFICATIONS PRÉALABLES
-- =====================================================

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_bot_one_records') THEN
    RAISE EXCEPTION 'Table crm_bot_one_records non trouvée. Veuillez d''abord créer les tables CRM Bot One.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_byw_records') THEN
    RAISE EXCEPTION 'Table crm_byw_records non trouvée. Veuillez d''abord créer les tables CRM BYW.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'activities') THEN
    RAISE EXCEPTION 'Table activities principale non trouvée. Veuillez d''abord créer le système d''activités principal.';
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'clients') THEN
    RAISE EXCEPTION 'Table clients principale non trouvée. Veuillez d''abord créer la table clients.';
  END IF;
END $$;

-- =====================================================
-- ÉTAPE 3: CRÉATION DES TABLES D'ACTIVITÉS
-- =====================================================

-- Table des activités CRM Bot One
CREATE TABLE IF NOT EXISTS crm_bot_one_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  date_utc TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('projet', 'prospect', 'bot_one_record')),
  priority TEXT NOT NULL CHECK (priority IN ('haute', 'moyenne', 'basse')),
  status TEXT NOT NULL CHECK (status IN ('a_faire', 'en_cours', 'termine')),
  related_id UUID NOT NULL,
  related_module TEXT NOT NULL CHECK (related_module IN ('projet', 'crm', 'crm_bot_one')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des activités CRM BYW
CREATE TABLE IF NOT EXISTS crm_byw_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  date_utc TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('projet', 'prospect', 'byw_record')),
  priority TEXT NOT NULL CHECK (priority IN ('haute', 'moyenne', 'basse')),
  status TEXT NOT NULL CHECK (status IN ('a_faire', 'en_cours', 'termine')),
  related_id UUID NOT NULL,
  related_module TEXT NOT NULL CHECK (related_module IN ('projet', 'crm', 'crm_byw')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- ÉTAPE 4: CRÉATION DES INDEX
-- =====================================================

-- Index pour CRM Bot One Activities
CREATE INDEX IF NOT EXISTS crm_bot_one_activities_date_idx ON crm_bot_one_activities (date_utc);
CREATE INDEX IF NOT EXISTS crm_bot_one_activities_type_idx ON crm_bot_one_activities (type);
CREATE INDEX IF NOT EXISTS crm_bot_one_activities_status_idx ON crm_bot_one_activities (status);
CREATE INDEX IF NOT EXISTS crm_bot_one_activities_related_idx ON crm_bot_one_activities (related_id, related_module);
CREATE INDEX IF NOT EXISTS crm_bot_one_activities_user_id_idx ON crm_bot_one_activities (user_id);

-- Index pour CRM BYW Activities
CREATE INDEX IF NOT EXISTS crm_byw_activities_date_idx ON crm_byw_activities (date_utc);
CREATE INDEX IF NOT EXISTS crm_byw_activities_type_idx ON crm_byw_activities (type);
CREATE INDEX IF NOT EXISTS crm_byw_activities_status_idx ON crm_byw_activities (status);
CREATE INDEX IF NOT EXISTS crm_byw_activities_related_idx ON crm_byw_activities (related_id, related_module);
CREATE INDEX IF NOT EXISTS crm_byw_activities_user_id_idx ON crm_byw_activities (user_id);

-- =====================================================
-- ÉTAPE 5: DÉSACTIVATION RLS (POUR SIMPLICITÉ)
-- =====================================================

ALTER TABLE crm_bot_one_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE crm_byw_activities DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- ÉTAPE 6: FONCTIONS DE SYNCHRONISATION DES ACTIVITÉS
-- =====================================================

-- Fonction pour synchroniser les activités Bot One vers la table principale
CREATE OR REPLACE FUNCTION sync_bot_one_activity_to_main(
  activity_data JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  main_activity_id UUID;
BEGIN
  INSERT INTO public.activities (
    title, description, date_utc, type, priority, status, related_id, related_module
  ) VALUES (
    activity_data->>'title',
    activity_data->>'description',
    (activity_data->>'date_utc')::timestamptz,
    activity_data->>'type',
    activity_data->>'priority',
    activity_data->>'status',
    (activity_data->>'related_id')::uuid,
    'crm_bot_one'
  ) RETURNING id INTO main_activity_id;
  
  RETURN main_activity_id;
END;
$$;

-- Fonction pour synchroniser les activités BYW vers la table principale
CREATE OR REPLACE FUNCTION sync_byw_activity_to_main(
  activity_data JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  main_activity_id UUID;
BEGIN
  INSERT INTO public.activities (
    title, description, date_utc, type, priority, status, related_id, related_module
  ) VALUES (
    activity_data->>'title',
    activity_data->>'description',
    (activity_data->>'date_utc')::timestamptz,
    activity_data->>'type',
    activity_data->>'priority',
    activity_data->>'status',
    (activity_data->>'related_id')::uuid,
    'crm_byw'
  ) RETURNING id INTO main_activity_id;
  
  RETURN main_activity_id;
END;
$$;

-- =====================================================
-- ÉTAPE 7: FONCTIONS DE CRÉATION D'ACTIVITÉS
-- =====================================================

-- Fonction pour créer une activité Bot One
CREATE OR REPLACE FUNCTION create_bot_one_record_activity(
  p_record_id UUID,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_activity_date TIMESTAMPTZ DEFAULT NOW(),
  p_type TEXT DEFAULT 'bot_one_record',
  p_priority TEXT DEFAULT 'moyenne',
  p_status TEXT DEFAULT 'a_faire'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  activity_id UUID;
  record_user_id UUID;
BEGIN
  SELECT user_id INTO record_user_id 
  FROM crm_bot_one_records 
  WHERE id = p_record_id;
  
  IF record_user_id IS NULL THEN
    RAISE EXCEPTION 'Enregistrement Bot One non trouvé: %', p_record_id;
  END IF;
  
  INSERT INTO crm_bot_one_activities (
    title, description, date_utc, type, priority, status,
    related_id, related_module, user_id
  ) VALUES (
    p_title, p_description, p_activity_date, p_type, p_priority, p_status,
    p_record_id, 'crm_bot_one', record_user_id
  ) RETURNING id INTO activity_id;
  
  PERFORM sync_bot_one_activity_to_main(
    jsonb_build_object(
      'title', p_title,
      'description', p_description,
      'date_utc', p_activity_date,
      'type', p_type,
      'priority', p_priority,
      'status', p_status,
      'related_id', p_record_id
    )
  );
  
  RETURN activity_id;
END;
$$;

-- Fonction pour créer une activité BYW
CREATE OR REPLACE FUNCTION create_byw_record_activity(
  p_record_id UUID,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_activity_date TIMESTAMPTZ DEFAULT NOW(),
  p_type TEXT DEFAULT 'byw_record',
  p_priority TEXT DEFAULT 'moyenne',
  p_status TEXT DEFAULT 'a_faire'
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  activity_id UUID;
  record_user_id UUID;
BEGIN
  SELECT user_id INTO record_user_id 
  FROM crm_byw_records 
  WHERE id = p_record_id;
  
  IF record_user_id IS NULL THEN
    RAISE EXCEPTION 'Enregistrement BYW non trouvé: %', p_record_id;
  END IF;
  
  INSERT INTO crm_byw_activities (
    title, description, date_utc, type, priority, status,
    related_id, related_module, user_id
  ) VALUES (
    p_title, p_description, p_activity_date, p_type, p_priority, p_status,
    p_record_id, 'crm_byw', record_user_id
  ) RETURNING id INTO activity_id;
  
  PERFORM sync_byw_activity_to_main(
    jsonb_build_object(
      'title', p_title,
      'description', p_description,
      'date_utc', p_activity_date,
      'type', p_type,
      'priority', p_priority,
      'status', p_status,
      'related_id', p_record_id
    )
  );
  
  RETURN activity_id;
END;
$$;

-- =====================================================
-- ÉTAPE 8: FONCTIONS DE SYNCHRONISATION DES CLIENTS
-- =====================================================

-- Fonction pour créer un client à partir d'un enregistrement Bot One
CREATE OR REPLACE FUNCTION create_client_from_bot_one_record(
  p_record_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_id UUID;
  record_data RECORD;
  client_name TEXT;
  client_email TEXT;
  client_phone TEXT;
  client_sector TEXT DEFAULT 'Non spécifié';
BEGIN
  SELECT 
    user_id,
    data,
    created_at
  INTO record_data
  FROM crm_bot_one_records 
  WHERE id = p_record_id;
  
  IF record_data IS NULL THEN
    RAISE EXCEPTION 'Enregistrement Bot One non trouvé: %', p_record_id;
  END IF;
  
  client_name := COALESCE(
    record_data.data->>'Nom de l''entreprise',
    record_data.data->>'Nom contact',
    'Client Bot One'
  );
  
  client_email := COALESCE(
    record_data.data->>'Email',
    'contact@example.com'
  );
  
  client_phone := COALESCE(
    record_data.data->>'Téléphone',
    ''
  );
  
  IF record_data.data->>'Type de contact' IS NOT NULL THEN
    client_sector := record_data.data->>'Type de contact';
  END IF;
  
  INSERT INTO clients (
    user_id, name, email, phone, address, sector, status,
    total_revenue, assigned_to, created_at, updated_at, last_contact
  ) VALUES (
    record_data.user_id, client_name, client_email, client_phone, '',
    client_sector, 'prospect', 0, record_data.user_id,
    record_data.created_at, record_data.created_at, record_data.created_at
  ) RETURNING id INTO client_id;
  
  PERFORM create_bot_one_record_activity(
    p_record_id,
    'Client créé dans CRM Principal',
    'Fiche client créée automatiquement depuis Bot One',
    NOW(),
    'bot_one_record',
    'moyenne',
    'termine'
  );
  
  RETURN client_id;
END;
$$;

-- Fonction pour créer un client à partir d'un enregistrement BYW
CREATE OR REPLACE FUNCTION create_client_from_byw_record(
  p_record_id UUID
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_id UUID;
  record_data RECORD;
  client_name TEXT;
  client_email TEXT;
  client_phone TEXT;
  client_sector TEXT DEFAULT 'BYW - Build Your Website';
  client_status TEXT;
BEGIN
  SELECT 
    user_id, company_name, contact_name, email, phone, client, created_at
  INTO record_data
  FROM crm_byw_records 
  WHERE id = p_record_id;
  
  IF record_data IS NULL THEN
    RAISE EXCEPTION 'Enregistrement BYW non trouvé: %', p_record_id;
  END IF;
  
  client_name := COALESCE(
    record_data.company_name,
    record_data.contact_name,
    'Client BYW'
  );
  
  client_email := COALESCE(record_data.email, 'contact@example.com');
  client_phone := COALESCE(record_data.phone, '');
  
  CASE record_data.client
    WHEN 'Client' THEN client_status := 'signe';
    WHEN 'Prospect' THEN client_status := 'prospect';
    ELSE client_status := 'prospect';
  END CASE;
  
  INSERT INTO clients (
    user_id, name, email, phone, address, sector, status,
    total_revenue, assigned_to, created_at, updated_at, last_contact
  ) VALUES (
    record_data.user_id, client_name, client_email, client_phone, '',
    client_sector, client_status, 0, record_data.user_id,
    record_data.created_at, record_data.created_at, record_data.created_at
  ) RETURNING id INTO client_id;
  
  PERFORM create_byw_record_activity(
    p_record_id,
    'Client créé dans CRM Principal',
    'Fiche client créée automatiquement depuis BYW',
    NOW(),
    'byw_record',
    'moyenne',
    'termine'
  );
  
  RETURN client_id;
END;
$$;

-- =====================================================
-- ÉTAPE 9: TRIGGERS AUTOMATIQUES
-- =====================================================

-- Supprimer les triggers existants
DROP TRIGGER IF EXISTS trigger_bot_one_create_client ON crm_bot_one_records;
DROP TRIGGER IF EXISTS trigger_byw_create_client ON crm_byw_records;

-- Fonction trigger pour Bot One
CREATE OR REPLACE FUNCTION trigger_create_client_from_bot_one()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_id UUID;
BEGIN
  SELECT create_client_from_bot_one_record(NEW.id) INTO client_id;
  RAISE NOTICE 'Client créé automatiquement pour Bot One record %: %', NEW.id, client_id;
  RETURN NEW;
END;
$$;

-- Fonction trigger pour BYW
CREATE OR REPLACE FUNCTION trigger_create_client_from_byw()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_id UUID;
BEGIN
  SELECT create_client_from_byw_record(NEW.id) INTO client_id;
  RAISE NOTICE 'Client créé automatiquement pour BYW record %: %', NEW.id, client_id;
  RETURN NEW;
END;
$$;

-- Créer les triggers
CREATE TRIGGER trigger_bot_one_create_client
  AFTER INSERT ON crm_bot_one_records
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_client_from_bot_one();

CREATE TRIGGER trigger_byw_create_client
  AFTER INSERT ON crm_byw_records
  FOR EACH ROW
  EXECUTE FUNCTION trigger_create_client_from_byw();

-- =====================================================
-- ÉTAPE 10: FONCTIONS DE SYNCHRONISATION MANUELLE
-- =====================================================

-- Fonction pour synchroniser tous les enregistrements Bot One existants
CREATE OR REPLACE FUNCTION sync_all_bot_one_to_clients()
RETURNS TABLE (
  records_processed BIGINT,
  clients_created BIGINT,
  clients_updated BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_records BIGINT := 0;
  created_count BIGINT := 0;
  record RECORD;
BEGIN
  SELECT COUNT(*) INTO total_records FROM crm_bot_one_records;
  
  FOR record IN 
    SELECT id FROM crm_bot_one_records 
    ORDER BY created_at
  LOOP
    IF create_client_from_bot_one_record(record.id) IS NOT NULL THEN
      created_count := created_count + 1;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT total_records, created_count, 0::BIGINT;
END;
$$;

-- Fonction pour synchroniser tous les enregistrements BYW existants
CREATE OR REPLACE FUNCTION sync_all_byw_to_clients()
RETURNS TABLE (
  records_processed BIGINT,
  clients_created BIGINT,
  clients_updated BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_records BIGINT := 0;
  created_count BIGINT := 0;
  record RECORD;
BEGIN
  SELECT COUNT(*) INTO total_records FROM crm_byw_records;
  
  FOR record IN 
    SELECT id FROM crm_byw_records 
    ORDER BY created_at
  LOOP
    IF create_client_from_byw_record(record.id) IS NOT NULL THEN
      created_count := created_count + 1;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT total_records, created_count, 0::BIGINT;
END;
$$;

-- =====================================================
-- ÉTAPE 11: VÉRIFICATIONS FINALES
-- =====================================================

-- Vérifier la création des tables
SELECT 
  'Tables créées' as info,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_name IN ('crm_bot_one_activities', 'crm_byw_activities');

-- Vérifier les fonctions créées
SELECT 
  'Fonctions créées' as info,
  COUNT(*) as count
FROM information_schema.routines 
WHERE routine_name IN (
  'sync_bot_one_activity_to_main',
  'sync_byw_activity_to_main',
  'create_bot_one_record_activity',
  'create_byw_record_activity',
  'create_client_from_bot_one_record',
  'create_client_from_byw_record',
  'trigger_create_client_from_bot_one',
  'trigger_create_client_from_byw',
  'sync_all_bot_one_to_clients',
  'sync_all_byw_to_clients'
);

-- Vérifier les triggers
SELECT 
  'Triggers créés' as info,
  COUNT(*) as count
FROM information_schema.triggers 
WHERE trigger_name IN (
  'trigger_bot_one_create_client',
  'trigger_byw_create_client'
);

-- =====================================================
-- ÉTAPE 12: MESSAGE DE CONFIRMATION
-- =====================================================

SELECT 
  '🎉 SYSTÈME COMPLET DÉPLOYÉ AVEC SUCCÈS' as status,
  'Activités + Synchronisation clients entre CRM Principal, Bot One et BYW' as message,
  'Chaque lead créé génère automatiquement une fiche client et des activités' as details,
  NOW() as deployment_time;
