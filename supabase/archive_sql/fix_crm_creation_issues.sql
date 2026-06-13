-- =====================================================
-- CORRECTION DES PROBLÈMES DE CRÉATION DE LEADS
-- =====================================================
-- Script pour corriger les erreurs qui empêchent la création de leads

-- =====================================================
-- ÉTAPE 1: DÉSACTIVER LES TRIGGERS PROBLÉMATIQUES
-- =====================================================

-- Supprimer les triggers qui causent des problèmes
DROP TRIGGER IF EXISTS trigger_bot_one_create_client ON crm_bot_one_records;
DROP TRIGGER IF EXISTS trigger_byw_create_client ON crm_byw_records;

-- =====================================================
-- ÉTAPE 2: CORRIGER LES TYPES DE COLONNES
-- =====================================================

-- Vérifier et corriger le type de la colonne status dans crm_byw_records
DO $$
BEGIN
  -- Vérifier si la colonne status existe et son type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'crm_byw_records' 
      AND column_name = 'status'
      AND data_type = 'USER-DEFINED'
  ) THEN
    -- Changer le type de status de client_status vers text
    ALTER TABLE crm_byw_records 
    ALTER COLUMN status TYPE TEXT;
    
    RAISE NOTICE 'Type de colonne status corrigé dans crm_byw_records';
  END IF;
END $$;

-- Vérifier et corriger le type de la colonne status dans crm_bot_one_records
DO $$
BEGIN
  -- Vérifier si la colonne status existe et son type
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'crm_bot_one_records' 
      AND column_name = 'status'
      AND data_type = 'USER-DEFINED'
  ) THEN
    -- Changer le type de status de client_status vers text
    ALTER TABLE crm_bot_one_records 
    ALTER COLUMN status TYPE TEXT;
    
    RAISE NOTICE 'Type de colonne status corrigé dans crm_bot_one_records';
  END IF;
END $$;

-- =====================================================
-- ÉTAPE 3: NETTOYER ET CORRIGER LES DONNÉES EXISTANTES
-- =====================================================

-- Nettoyer les données existantes avant d'ajouter les contraintes
DO $$
BEGIN
  -- Mettre à jour les valeurs de status invalides dans crm_bot_one_records
  UPDATE crm_bot_one_records 
  SET status = 'active' 
  WHERE status IS NULL OR status NOT IN ('active', 'inactive', 'archived');
  
  -- Mettre à jour les valeurs de status invalides dans crm_byw_records
  UPDATE crm_byw_records 
  SET status = 'active' 
  WHERE status IS NULL OR status NOT IN ('active', 'inactive', 'archived');
  
  RAISE NOTICE 'Données de statut nettoyées';
END $$;

-- =====================================================
-- ÉTAPE 4: VÉRIFIER LES CONTRAINTES
-- =====================================================

-- Vérifier que les colonnes status acceptent les valeurs text
DO $$
BEGIN
  -- Supprimer les contraintes existantes si elles existent
  ALTER TABLE crm_byw_records DROP CONSTRAINT IF EXISTS crm_byw_records_status_check;
  ALTER TABLE crm_bot_one_records DROP CONSTRAINT IF EXISTS crm_bot_one_records_status_check;
  
  -- Ajouter des contraintes CHECK avec les valeurs utilisées par le frontend
  ALTER TABLE crm_byw_records 
  ADD CONSTRAINT crm_byw_records_status_check 
  CHECK (status IN ('active', 'inactive', 'archived', 'prospect', 'client', 'perdu'));
  
  ALTER TABLE crm_bot_one_records 
  ADD CONSTRAINT crm_bot_one_records_status_check 
  CHECK (status IN ('active', 'inactive', 'archived', 'prospect', 'en discussion', 'demo planifié', 'abonné', 'perdu'));
  
  RAISE NOTICE 'Contraintes de statut ajoutées';
END $$;

-- =====================================================
-- ÉTAPE 5: CRÉER DES FONCTIONS DE SYNCHRONISATION MANUELLE
-- =====================================================

-- Fonction pour synchroniser manuellement un enregistrement Bot One vers un client
CREATE OR REPLACE FUNCTION sync_bot_one_record_to_client(
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
  entreprise_name TEXT;
  contact_name TEXT;
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
  entreprise_name := record_data.data->>'Nom de l''entreprise';
  contact_name := record_data.data->>'Nom contact';
  
  client_name := COALESCE(
    entreprise_name,
    contact_name,
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
  
  -- Vérifier si un client existe déjà
  SELECT id INTO client_id
  FROM clients 
  WHERE user_id = record_data.user_id 
    AND name = client_name;
  
  IF client_id IS NULL THEN
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
    
    RAISE NOTICE 'Client créé pour Bot One record %: %', p_record_id, client_id;
  ELSE
    RAISE NOTICE 'Client existant trouvé pour Bot One record %: %', p_record_id, client_id;
  END IF;
  
  RETURN client_id;
END;
$$;

-- Fonction pour synchroniser manuellement un enregistrement BYW vers un client
CREATE OR REPLACE FUNCTION sync_byw_record_to_client(
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
  
  -- Vérifier si un client existe déjà
  SELECT id INTO client_id
  FROM clients 
  WHERE user_id = record_data.user_id 
    AND name = client_name;
  
  IF client_id IS NULL THEN
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
    
    RAISE NOTICE 'Client créé pour BYW record %: %', p_record_id, client_id;
  ELSE
    RAISE NOTICE 'Client existant trouvé pour BYW record %: %', p_record_id, client_id;
  END IF;
  
  RETURN client_id;
END;
$$;

-- =====================================================
-- ÉTAPE 6: VÉRIFICATIONS
-- =====================================================

-- Vérifier que les triggers ont été supprimés
SELECT 
  'Triggers supprimés' as info,
  COUNT(*) as count
FROM information_schema.triggers 
WHERE trigger_name IN (
  'trigger_bot_one_create_client',
  'trigger_byw_create_client'
);

-- Vérifier les types de colonnes
SELECT 
  'Types de colonnes' as info,
  table_name,
  column_name,
  data_type
FROM information_schema.columns 
WHERE table_name IN ('crm_bot_one_records', 'crm_byw_records')
  AND column_name = 'status';

-- Vérifier que les nouvelles fonctions existent
SELECT 
  'Fonctions de synchronisation manuelle créées' as info,
  COUNT(*) as count
FROM information_schema.routines 
WHERE routine_name IN (
  'sync_bot_one_record_to_client',
  'sync_byw_record_to_client'
);

-- =====================================================
-- ÉTAPE 7: MESSAGE DE CONFIRMATION
-- =====================================================

SELECT 
  '✅ PROBLÈMES DE CRÉATION DE LEADS CORRIGÉS' as status,
  'Les triggers automatiques ont été désactivés' as message,
  'Utilisez les fonctions de synchronisation manuelle si nécessaire' as details,
  NOW() as fix_time;
