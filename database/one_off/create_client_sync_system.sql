-- =====================================================
-- SYSTÈME DE SYNCHRONISATION CLIENTS
-- =====================================================
-- Script pour synchroniser automatiquement les leads des CRM Bot One et BYW
-- vers la table clients du CRM Principal

-- =====================================================
-- ÉTAPE 1: FONCTIONS DE SYNCHRONISATION CLIENTS
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
  -- Récupérer les données de l'enregistrement Bot One
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
  
  -- Extraire les informations du JSONB
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
  
  -- Déterminer le secteur si disponible
  IF record_data.data->>'Type de contact' IS NOT NULL THEN
    client_sector := record_data.data->>'Type de contact';
  END IF;
  
  -- Créer le client dans la table principale
  INSERT INTO clients (
    user_id,
    name,
    email,
    phone,
    address,
    sector,
    status,
    total_revenue,
    assigned_to,
    created_at,
    updated_at,
    last_contact
  ) VALUES (
    record_data.user_id,
    client_name,
    client_email,
    client_phone,
    '', -- Adresse vide par défaut
    client_sector,
    'prospect',
    0,
    record_data.user_id, -- Assigné à l'utilisateur créateur
    record_data.created_at,
    record_data.created_at,
    record_data.created_at
  ) RETURNING id INTO client_id;
  
  -- Créer une activité de suivi automatique
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
  -- Récupérer les données de l'enregistrement BYW
  SELECT 
    user_id,
    company_name,
    contact_name,
    email,
    phone,
    client,
    created_at
  INTO record_data
  FROM crm_byw_records 
  WHERE id = p_record_id;
  
  IF record_data IS NULL THEN
    RAISE EXCEPTION 'Enregistrement BYW non trouvé: %', p_record_id;
  END IF;
  
  -- Construire le nom du client
  client_name := COALESCE(
    record_data.company_name,
    record_data.contact_name,
    'Client BYW'
  );
  
  client_email := COALESCE(record_data.email, 'contact@example.com');
  client_phone := COALESCE(record_data.phone, '');
  
  -- Déterminer le statut selon le champ client
  CASE record_data.client
    WHEN 'Client' THEN client_status := 'signe';
    WHEN 'Prospect' THEN client_status := 'prospect';
    ELSE client_status := 'prospect';
  END CASE;
  
  -- Créer le client dans la table principale
  INSERT INTO clients (
    user_id,
    name,
    email,
    phone,
    address,
    sector,
    status,
    total_revenue,
    assigned_to,
    created_at,
    updated_at,
    last_contact
  ) VALUES (
    record_data.user_id,
    client_name,
    client_email,
    client_phone,
    '', -- Adresse vide par défaut
    client_sector,
    client_status,
    0,
    record_data.user_id, -- Assigné à l'utilisateur créateur
    record_data.created_at,
    record_data.created_at,
    record_data.created_at
  ) RETURNING id INTO client_id;
  
  -- Créer une activité de suivi automatique
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
-- ÉTAPE 2: FONCTIONS DE MISE À JOUR DES CLIENTS
-- =====================================================

-- Fonction pour mettre à jour un client à partir d'un enregistrement Bot One
CREATE OR REPLACE FUNCTION update_client_from_bot_one_record(
  p_record_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  record_data RECORD;
  client_exists BOOLEAN := FALSE;
  client_id UUID;
BEGIN
  -- Récupérer les données de l'enregistrement Bot One
  SELECT 
    user_id,
    data,
    updated_at
  INTO record_data
  FROM crm_bot_one_records 
  WHERE id = p_record_id;
  
  IF record_data IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Vérifier si un client existe déjà pour cet enregistrement
  SELECT EXISTS(
    SELECT 1 FROM clients 
    WHERE user_id = record_data.user_id 
      AND name = COALESCE(record_data.data->>'Nom de l''entreprise', record_data.data->>'Nom contact')
  ) INTO client_exists;
  
  IF client_exists THEN
    -- Mettre à jour le client existant
    UPDATE clients SET
      email = COALESCE(record_data.data->>'Email', email),
      phone = COALESCE(record_data.data->>'Téléphone', phone),
      updated_at = record_data.updated_at,
      last_contact = record_data.updated_at
    WHERE user_id = record_data.user_id 
      AND name = COALESCE(record_data.data->>'Nom de l''entreprise', record_data.data->>'Nom contact');
    
    RETURN TRUE;
  ELSE
    -- Créer un nouveau client
    SELECT create_client_from_bot_one_record(p_record_id) INTO client_id;
    RETURN TRUE;
  END IF;
END;
$$;

-- Fonction pour mettre à jour un client à partir d'un enregistrement BYW
CREATE OR REPLACE FUNCTION update_client_from_byw_record(
  p_record_id UUID
) RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  record_data RECORD;
  client_exists BOOLEAN := FALSE;
  client_id UUID;
  client_status TEXT;
BEGIN
  -- Récupérer les données de l'enregistrement BYW
  SELECT 
    user_id,
    company_name,
    contact_name,
    email,
    phone,
    client,
    updated_at
  INTO record_data
  FROM crm_byw_records 
  WHERE id = p_record_id;
  
  IF record_data IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- Vérifier si un client existe déjà pour cet enregistrement
  SELECT EXISTS(
    SELECT 1 FROM clients 
    WHERE user_id = record_data.user_id 
      AND name = COALESCE(record_data.company_name, record_data.contact_name)
  ) INTO client_exists;
  
  -- Déterminer le statut selon le champ client
  CASE record_data.client
    WHEN 'Client' THEN client_status := 'signe';
    WHEN 'Prospect' THEN client_status := 'prospect';
    ELSE client_status := 'prospect';
  END CASE;
  
  IF client_exists THEN
    -- Mettre à jour le client existant
    UPDATE clients SET
      email = COALESCE(record_data.email, email),
      phone = COALESCE(record_data.phone, phone),
      status = client_status,
      updated_at = record_data.updated_at,
      last_contact = record_data.updated_at
    WHERE user_id = record_data.user_id 
      AND name = COALESCE(record_data.company_name, record_data.contact_name);
    
    RETURN TRUE;
  ELSE
    -- Créer un nouveau client
    SELECT create_client_from_byw_record(p_record_id) INTO client_id;
    RETURN TRUE;
  END IF;
END;
$$;

-- =====================================================
-- ÉTAPE 3: TRIGGERS AUTOMATIQUES
-- =====================================================

-- Trigger pour créer automatiquement un client lors de l'insertion d'un enregistrement Bot One
CREATE OR REPLACE FUNCTION trigger_create_client_from_bot_one()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_id UUID;
BEGIN
  -- Créer le client automatiquement
  SELECT create_client_from_bot_one_record(NEW.id) INTO client_id;
  
  RAISE NOTICE 'Client créé automatiquement pour Bot One record %: %', NEW.id, client_id;
  
  RETURN NEW;
END;
$$;

-- Trigger pour créer automatiquement un client lors de l'insertion d'un enregistrement BYW
CREATE OR REPLACE FUNCTION trigger_create_client_from_byw()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  client_id UUID;
BEGIN
  -- Créer le client automatiquement
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
-- ÉTAPE 4: FONCTIONS DE SYNCHRONISATION MANUELLE
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
  updated_count BIGINT := 0;
  record RECORD;
BEGIN
  -- Compter le total des enregistrements
  SELECT COUNT(*) INTO total_records FROM crm_bot_one_records;
  
  -- Traiter chaque enregistrement
  FOR record IN 
    SELECT id FROM crm_bot_one_records 
    ORDER BY created_at
  LOOP
    IF update_client_from_bot_one_record(record.id) THEN
      created_count := created_count + 1;
    ELSE
      updated_count := updated_count + 1;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT total_records, created_count, updated_count;
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
  updated_count BIGINT := 0;
  record RECORD;
BEGIN
  -- Compter le total des enregistrements
  SELECT COUNT(*) INTO total_records FROM crm_byw_records;
  
  -- Traiter chaque enregistrement
  FOR record IN 
    SELECT id FROM crm_byw_records 
    ORDER BY created_at
  LOOP
    IF update_client_from_byw_record(record.id) THEN
      created_count := created_count + 1;
    ELSE
      updated_count := updated_count + 1;
    END IF;
  END LOOP;
  
  RETURN QUERY SELECT total_records, created_count, updated_count;
END;
$$;

-- =====================================================
-- ÉTAPE 5: VÉRIFICATIONS
-- =====================================================

-- Vérifier que les fonctions ont été créées
SELECT 
  'Fonctions de synchronisation clients créées' as info,
  COUNT(*) as count
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

-- Afficher un message de confirmation
SELECT 
  '✅ SYSTÈME DE SYNCHRONISATION CLIENTS DÉPLOYÉ' as status,
  'Les leads Bot One et BYW créent automatiquement des fiches clients' as message,
  NOW() as deployment_time;
