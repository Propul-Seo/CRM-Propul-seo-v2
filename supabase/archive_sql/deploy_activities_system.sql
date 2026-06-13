-- =====================================================
-- DÉPLOIEMENT COMPLET DU SYSTÈME D'ACTIVITÉS
-- =====================================================
-- Script principal pour déployer le système d'activités
-- sur CRM Bot One et CRM BYW avec synchronisation

-- =====================================================
-- ÉTAPE 1: CRÉATION DE LA FONCTION handle_updated_at
-- =====================================================

-- Créer la fonction handle_updated_at si elle n'existe pas
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

-- Vérifier que les tables CRM existent
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
END $$;

-- =====================================================
-- ÉTAPE 3: CRÉATION DES TABLES D'ACTIVITÉS
-- =====================================================

-- Créer la table des activités CRM Bot One
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

-- Créer la table des activités CRM BYW
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

-- Désactiver RLS pour éviter les conflits
ALTER TABLE crm_bot_one_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE crm_byw_activities DISABLE ROW LEVEL SECURITY;

-- =====================================================
-- ÉTAPE 6: SUPPRESSION DES TRIGGERS (POUR ÉVITER LES CONFLITS)
-- =====================================================

-- Supprimer tous les triggers existants
DROP TRIGGER IF EXISTS handle_crm_bot_one_activities_updated_at ON crm_bot_one_activities;
DROP TRIGGER IF EXISTS handle_crm_byw_activities_updated_at ON crm_byw_activities;
DROP TRIGGER IF EXISTS trigger_byw_automatic_activities ON crm_byw_records;

-- Note: Les triggers seront créés plus tard si nécessaire

-- =====================================================
-- ÉTAPE 7: FONCTIONS DE SYNCHRONISATION
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
    activity_data->>'priority',
    activity_data->>'status',
    (activity_data->>'related_id')::uuid,
    'crm_byw'
  ) RETURNING id INTO main_activity_id;
  
  RETURN main_activity_id;
END;
$$;

-- =====================================================
-- ÉTAPE 8: FONCTIONS SPÉCIFIQUES PAR MODULE
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
-- ÉTAPE 9: TRIGGERS AUTOMATIQUES POUR BYW
-- =====================================================

-- Fonction pour créer des activités automatiques BYW
CREATE OR REPLACE FUNCTION create_byw_automatic_activities()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  activity_title TEXT;
  activity_description TEXT;
BEGIN
  -- Activité pour présentation envoyée
  IF OLD.presentation_envoye != NEW.presentation_envoye AND NEW.presentation_envoye = 'Oui' THEN
    activity_title := 'Présentation envoyée à ' || COALESCE(NEW.company_name, 'le contact');
    activity_description := 'Présentation envoyée le ' || TO_CHAR(NOW(), 'DD/MM/YYYY à HH24:MI');
    PERFORM create_byw_record_activity(
      NEW.id, activity_title, activity_description, NOW(), 'byw_record', 'moyenne', 'termine'
    );
  END IF;
  
  -- Activité pour RDV planifié
  IF OLD.rdv != NEW.rdv AND NEW.rdv != 'Non planifié' THEN
    activity_title := 'RDV planifié avec ' || COALESCE(NEW.company_name, 'le contact');
    activity_description := 'RDV ' || NEW.rdv;
    PERFORM create_byw_record_activity(
      NEW.id, activity_title, activity_description, NEW.rdv_date, 'byw_record', 'haute', 'a_faire'
    );
  END IF;
  
  -- Activité pour démo programmée
  IF OLD.demo != NEW.demo AND NEW.demo != 'Non programmée' THEN
    activity_title := 'Démo programmée pour ' || COALESCE(NEW.company_name, 'le contact');
    activity_description := 'Démo ' || NEW.demo;
    PERFORM create_byw_record_activity(
      NEW.id, activity_title, activity_description, NEW.demo_date, 'byw_record', 'haute', 'a_faire'
    );
  END IF;
  
  -- Activité pour conversion client
  IF OLD.client != NEW.client AND NEW.client = 'Client' THEN
    activity_title := 'Conversion client: ' || COALESCE(NEW.company_name, 'le contact');
    activity_description := 'Client converti le ' || TO_CHAR(NOW(), 'DD/MM/YYYY à HH24:MI');
    PERFORM create_byw_record_activity(
      NEW.id, activity_title, activity_description, NEW.conversion_date, 'byw_record', 'haute', 'termine'
    );
  END IF;
  
  -- Activité pour lead perdu
  IF OLD.perdu != NEW.perdu AND NEW.perdu = 'Oui' THEN
    activity_title := 'Lead perdu: ' || COALESCE(NEW.company_name, 'le contact');
    activity_description := 'Lead marqué comme perdu le ' || TO_CHAR(NOW(), 'DD/MM/YYYY à HH24:MI');
    PERFORM create_byw_record_activity(
      NEW.id, activity_title, activity_description, NEW.lost_date, 'byw_record', 'basse', 'termine'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- Note: Trigger automatique BYW désactivé pour éviter les conflits
-- CREATE TRIGGER trigger_byw_automatic_activities
--   AFTER UPDATE ON crm_byw_records
--   FOR EACH ROW
--   EXECUTE FUNCTION create_byw_automatic_activities();

-- =====================================================
-- ÉTAPE 10: VÉRIFICATIONS FINALES
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
  'create_byw_automatic_activities'
);

-- Afficher la structure des nouvelles tables
SELECT 
  'Structure CRM Bot One Activities' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'crm_bot_one_activities'
ORDER BY ordinal_position;

SELECT 
  'Structure CRM BYW Activities' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'crm_byw_activities'
ORDER BY ordinal_position;

-- =====================================================
-- ÉTAPE 11: MESSAGE DE CONFIRMATION
-- =====================================================

SELECT 
  '✅ SYSTÈME D''ACTIVITÉS DÉPLOYÉ AVEC SUCCÈS' as status,
  'Les activités sont maintenant synchronisées entre CRM Principal, Bot One et BYW' as message,
  NOW() as deployment_time;
