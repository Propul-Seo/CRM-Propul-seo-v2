-- =====================================================
-- CRÉATION DU SYSTÈME D'ACTIVITÉS POUR CRM BYW
-- =====================================================
-- Script pour synchroniser les activités avec le système CRM BYW
-- Compatible avec la structure existante du CRM Principal

-- 1. Table des activités CRM BYW
CREATE TABLE IF NOT EXISTS crm_byw_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  date_utc TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('projet', 'prospect', 'byw_record')),
  priority TEXT NOT NULL CHECK (priority IN ('haute', 'moyenne', 'basse')),
  status TEXT NOT NULL CHECK (status IN ('a_faire', 'en_cours', 'termine')),
  related_id UUID NOT NULL, -- Référence vers crm_byw_records.id
  related_module TEXT NOT NULL CHECK (related_module IN ('projet', 'crm', 'crm_byw')),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS crm_byw_activities_date_idx ON crm_byw_activities (date_utc);
CREATE INDEX IF NOT EXISTS crm_byw_activities_type_idx ON crm_byw_activities (type);
CREATE INDEX IF NOT EXISTS crm_byw_activities_status_idx ON crm_byw_activities (status);
CREATE INDEX IF NOT EXISTS crm_byw_activities_related_idx ON crm_byw_activities (related_id, related_module);
CREATE INDEX IF NOT EXISTS crm_byw_activities_user_id_idx ON crm_byw_activities (user_id);

-- 3. Activer RLS (Row Level Security)
ALTER TABLE crm_byw_activities ENABLE ROW LEVEL SECURITY;

-- 4. Politiques RLS pour l'accès sécurisé
CREATE POLICY "Users can view their byw activities" ON crm_byw_activities
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their byw activities" ON crm_byw_activities
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their byw activities" ON crm_byw_activities
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their byw activities" ON crm_byw_activities
  FOR DELETE USING (auth.uid() = user_id);

-- 5. Trigger pour mettre à jour automatiquement updated_at
CREATE TRIGGER handle_crm_byw_activities_updated_at
  BEFORE UPDATE ON crm_byw_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- 6. Fonction pour synchroniser les activités avec le CRM Principal
CREATE OR REPLACE FUNCTION sync_byw_activity_to_main(
  activity_data JSONB
) RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  main_activity_id UUID;
BEGIN
  -- Insérer dans la table activities principale
  INSERT INTO public.activities (
    title,
    description,
    date_utc,
    type,
    priority,
    status,
    related_id,
    related_module
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

-- 7. Fonction pour créer une activité liée à un enregistrement BYW
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
  -- Récupérer l'utilisateur propriétaire de l'enregistrement
  SELECT user_id INTO record_user_id 
  FROM crm_byw_records 
  WHERE id = p_record_id;
  
  IF record_user_id IS NULL THEN
    RAISE EXCEPTION 'Enregistrement BYW non trouvé: %', p_record_id;
  END IF;
  
  -- Créer l'activité
  INSERT INTO crm_byw_activities (
    title,
    description,
    date_utc,
    type,
    priority,
    status,
    related_id,
    related_module,
    user_id
  ) VALUES (
    p_title,
    p_description,
    p_activity_date,
    p_type,
    p_priority,
    p_status,
    p_record_id,
    'crm_byw',
    record_user_id
  ) RETURNING id INTO activity_id;
  
  -- Synchroniser avec la table principale
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

-- 8. Fonction pour obtenir les activités d'un enregistrement BYW
CREATE OR REPLACE FUNCTION get_byw_record_activities(
  p_record_id UUID
) RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  date_utc TIMESTAMPTZ,
  type TEXT,
  priority TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.description,
    a.date_utc,
    a.type,
    a.priority,
    a.status,
    a.created_at,
    a.updated_at
  FROM crm_byw_activities a
  WHERE a.related_id = p_record_id
    AND a.related_module = 'crm_byw'
    AND a.user_id = auth.uid()
  ORDER BY a.date_utc DESC;
END;
$$;

-- 9. Fonction pour créer des activités automatiques basées sur les changements BYW
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
      NEW.id,
      activity_title,
      activity_description,
      NOW(),
      'byw_record',
      'moyenne',
      'termine'
    );
  END IF;
  
  -- Activité pour RDV planifié
  IF OLD.rdv != NEW.rdv AND NEW.rdv != 'Non planifié' THEN
    activity_title := 'RDV planifié avec ' || COALESCE(NEW.company_name, 'le contact');
    activity_description := 'RDV ' || NEW.rdv;
    PERFORM create_byw_record_activity(
      NEW.id,
      activity_title,
      activity_description,
      NEW.rdv_date,
      'byw_record',
      'haute',
      'a_faire'
    );
  END IF;
  
  -- Activité pour démo programmée
  IF OLD.demo != NEW.demo AND NEW.demo != 'Non programmée' THEN
    activity_title := 'Démo programmée pour ' || COALESCE(NEW.company_name, 'le contact');
    activity_description := 'Démo ' || NEW.demo;
    PERFORM create_byw_record_activity(
      NEW.id,
      activity_title,
      activity_description,
      NEW.demo_date,
      'byw_record',
      'haute',
      'a_faire'
    );
  END IF;
  
  -- Activité pour conversion client
  IF OLD.client != NEW.client AND NEW.client = 'Client' THEN
    activity_title := 'Conversion client: ' || COALESCE(NEW.company_name, 'le contact');
    activity_description := 'Client converti le ' || TO_CHAR(NOW(), 'DD/MM/YYYY à HH24:MI');
    PERFORM create_byw_record_activity(
      NEW.id,
      activity_title,
      activity_description,
      NEW.conversion_date,
      'byw_record',
      'haute',
      'termine'
    );
  END IF;
  
  -- Activité pour lead perdu
  IF OLD.perdu != NEW.perdu AND NEW.perdu = 'Oui' THEN
    activity_title := 'Lead perdu: ' || COALESCE(NEW.company_name, 'le contact');
    activity_description := 'Lead marqué comme perdu le ' || TO_CHAR(NOW(), 'DD/MM/YYYY à HH24:MI');
    PERFORM create_byw_record_activity(
      NEW.id,
      activity_title,
      activity_description,
      NEW.lost_date,
      'byw_record',
      'basse',
      'termine'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

-- 10. Créer le trigger pour les activités automatiques
CREATE TRIGGER trigger_byw_automatic_activities
  AFTER UPDATE ON crm_byw_records
  FOR EACH ROW
  EXECUTE FUNCTION create_byw_automatic_activities();

-- 11. Vérification de la création
SELECT 
  'Table crm_byw_activities créée' as info,
  COUNT(*) as count
FROM information_schema.tables 
WHERE table_name = 'crm_byw_activities';

-- 12. Afficher la structure de la table
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'crm_byw_activities'
ORDER BY ordinal_position;
