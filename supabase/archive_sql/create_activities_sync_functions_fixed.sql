-- =====================================================
-- FONCTIONS DE SYNCHRONISATION DES ACTIVITÉS (CORRIGÉ)
-- =====================================================

-- Fonction pour créer une activité Bot One et la synchroniser
CREATE OR REPLACE FUNCTION public.create_bot_one_activity(
  p_record_id UUID,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_activity_date TIMESTAMPTZ DEFAULT NOW(),
  p_type TEXT DEFAULT 'note',
  p_status TEXT DEFAULT 'scheduled'
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
  record_data RECORD;
  client_id UUID;
BEGIN
  -- Vérifier que le record existe
  SELECT * INTO record_data FROM crm_bot_one_records WHERE id = p_record_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Record Bot One non trouvé avec ID: %', p_record_id;
  END IF;
  
  -- Créer l'activité dans la table Bot One
  INSERT INTO crm_bot_one_activities (
    bot_one_record_id,
    title,
    description,
    activity_date,
    type,
    status
  ) VALUES (
    p_record_id,
    p_title,
    p_description,
    p_activity_date,
    p_type,
    p_status
  ) RETURNING id INTO activity_id;
  
  -- Trouver le client correspondant
  SELECT id INTO client_id 
  FROM clients 
  WHERE name = COALESCE(record_data.data->>'Nom de l''entreprise', record_data.data->>'Nom contact');
  
  -- Si le client existe, créer l'activité dans la table principale
  IF client_id IS NOT NULL THEN
    INSERT INTO activities (
      title,
      description,
      date_utc,
      type,
      priority,
      status,
      related_id,
      related_module
    ) VALUES (
      p_title,
      p_description,
      p_activity_date,
      CASE 
        WHEN p_type = 'call' THEN 'projet'
        WHEN p_type = 'meeting' THEN 'projet'
        ELSE 'prospect'
      END,
      'moyenne',
      CASE 
        WHEN p_status = 'completed' THEN 'termine'
        WHEN p_status = 'cancelled' THEN 'termine'
        ELSE 'a_faire'
      END,
      client_id,
      'crm'
    );
  END IF;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer une activité BYW et la synchroniser
CREATE OR REPLACE FUNCTION public.create_byw_activity(
  p_record_id UUID,
  p_title TEXT,
  p_description TEXT DEFAULT NULL,
  p_activity_date TIMESTAMPTZ DEFAULT NOW(),
  p_type TEXT DEFAULT 'note',
  p_status TEXT DEFAULT 'scheduled'
)
RETURNS UUID AS $$
DECLARE
  activity_id UUID;
  record_data RECORD;
  client_id UUID;
BEGIN
  -- Vérifier que le record existe
  SELECT * INTO record_data FROM crm_byw_records WHERE id = p_record_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Record BYW non trouvé avec ID: %', p_record_id;
  END IF;
  
  -- Créer l'activité dans la table BYW
  INSERT INTO crm_byw_activities (
    byw_record_id,
    title,
    description,
    activity_date,
    type,
    status
  ) VALUES (
    p_record_id,
    p_title,
    p_description,
    p_activity_date,
    p_type,
    p_status
  ) RETURNING id INTO activity_id;
  
  -- Trouver le client correspondant
  SELECT id INTO client_id 
  FROM clients 
  WHERE name = record_data.company_name;
  
  -- Si le client existe, créer l'activité dans la table principale
  IF client_id IS NOT NULL THEN
    INSERT INTO activities (
      title,
      description,
      date_utc,
      type,
      priority,
      status,
      related_id,
      related_module
    ) VALUES (
      p_title,
      p_description,
      p_activity_date,
      CASE 
        WHEN p_type = 'call' THEN 'projet'
        WHEN p_type = 'meeting' THEN 'projet'
        ELSE 'prospect'
      END,
      'moyenne',
      CASE 
        WHEN p_status = 'completed' THEN 'termine'
        WHEN p_status = 'cancelled' THEN 'termine'
        ELSE 'a_faire'
      END,
      client_id,
      'crm'
    );
  END IF;
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour récupérer les activités d'un record Bot One
CREATE OR REPLACE FUNCTION public.get_bot_one_activities(p_record_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  activity_date TIMESTAMPTZ,
  type TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.description,
    a.activity_date,
    a.type,
    a.status,
    a.created_at,
    a.updated_at
  FROM crm_bot_one_activities a
  WHERE a.bot_one_record_id = p_record_id
  ORDER BY a.activity_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour récupérer les activités d'un record BYW
CREATE OR REPLACE FUNCTION public.get_byw_activities(p_record_id UUID)
RETURNS TABLE (
  id UUID,
  title TEXT,
  description TEXT,
  activity_date TIMESTAMPTZ,
  type TEXT,
  status TEXT,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    a.id,
    a.title,
    a.description,
    a.activity_date,
    a.type,
    a.status,
    a.created_at,
    a.updated_at
  FROM crm_byw_activities a
  WHERE a.byw_record_id = p_record_id
  ORDER BY a.activity_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour une activité Bot One
CREATE OR REPLACE FUNCTION public.update_bot_one_activity(
  p_activity_id UUID,
  p_title TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_activity_date TIMESTAMPTZ DEFAULT NULL,
  p_type TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  activity_record RECORD;
  record_data RECORD;
  client_id UUID;
BEGIN
  -- Récupérer l'activité
  SELECT * INTO activity_record FROM crm_bot_one_activities WHERE id = p_activity_id;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Mettre à jour l'activité
  UPDATE crm_bot_one_activities SET
    title = COALESCE(p_title, title),
    description = COALESCE(p_description, description),
    activity_date = COALESCE(p_activity_date, activity_date),
    type = COALESCE(p_type, type),
    status = COALESCE(p_status, status),
    updated_at = NOW()
  WHERE id = p_activity_id;
  
  -- Synchroniser avec la table principale si le client existe
  SELECT * INTO record_data FROM crm_bot_one_records WHERE id = activity_record.bot_one_record_id;
  SELECT id INTO client_id 
  FROM clients 
  WHERE name = COALESCE(record_data.data->>'Nom de l''entreprise', record_data.data->>'Nom contact');
  
  IF client_id IS NOT NULL THEN
    -- Mettre à jour l'activité dans la table principale
    UPDATE activities SET
      title = COALESCE(p_title, title),
      description = COALESCE(p_description, description),
      date_utc = COALESCE(p_activity_date, date_utc),
      status = CASE 
        WHEN COALESCE(p_status, activity_record.status) = 'completed' THEN 'termine'
        WHEN COALESCE(p_status, activity_record.status) = 'cancelled' THEN 'termine'
        ELSE 'a_faire'
      END,
      updated_at = NOW()
    WHERE related_id = client_id 
      AND related_module = 'crm'
      AND title = activity_record.title;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour supprimer une activité Bot One
CREATE OR REPLACE FUNCTION public.delete_bot_one_activity(p_activity_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  activity_record RECORD;
  record_data RECORD;
  client_id UUID;
BEGIN
  -- Récupérer l'activité
  SELECT * INTO activity_record FROM crm_bot_one_activities WHERE id = p_activity_id;
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Supprimer l'activité
  DELETE FROM crm_bot_one_activities WHERE id = p_activity_id;
  
  -- Synchroniser avec la table principale si le client existe
  SELECT * INTO record_data FROM crm_bot_one_records WHERE id = activity_record.bot_one_record_id;
  SELECT id INTO client_id 
  FROM clients 
  WHERE name = COALESCE(record_data.data->>'Nom de l''entreprise', record_data.data->>'Nom contact');
  
  IF client_id IS NOT NULL THEN
    -- Supprimer l'activité de la table principale
    DELETE FROM activities 
    WHERE related_id = client_id 
      AND related_module = 'crm'
      AND title = activity_record.title;
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Message de confirmation
SELECT 
  'FONCTIONS D''ACTIVITÉS CRÉÉES (CORRIGÉ)' as status,
  'Fonctions de synchronisation des activités créées avec succès' as message,
  NOW() as creation_time;
