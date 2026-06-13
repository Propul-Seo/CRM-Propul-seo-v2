-- =====================================================
-- DÉPLOIEMENT SIMPLE DU SYSTÈME D'ACTIVITÉS (SANS RLS)
-- =====================================================

-- ÉTAPE 1: Supprimer les tables existantes si elles existent
DROP TABLE IF EXISTS public.crm_bot_one_activities CASCADE;
DROP TABLE IF EXISTS public.crm_byw_activities CASCADE;

-- ÉTAPE 2: Créer les tables d'activités
CREATE TABLE public.crm_bot_one_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bot_one_record_id UUID NOT NULL REFERENCES public.crm_bot_one_records(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  activity_date TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'note', 'task')),
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.crm_byw_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  byw_record_id UUID NOT NULL REFERENCES public.crm_byw_records(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  activity_date TIMESTAMPTZ NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('call', 'email', 'meeting', 'note', 'task')),
  status TEXT NOT NULL CHECK (status IN ('scheduled', 'completed', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ÉTAPE 3: Créer les index
CREATE INDEX idx_crm_bot_one_activities_record_id ON public.crm_bot_one_activities(bot_one_record_id);
CREATE INDEX idx_crm_bot_one_activities_date ON public.crm_bot_one_activities(activity_date);
CREATE INDEX idx_crm_bot_one_activities_status ON public.crm_bot_one_activities(status);

CREATE INDEX idx_crm_byw_activities_record_id ON public.crm_byw_activities(byw_record_id);
CREATE INDEX idx_crm_byw_activities_date ON public.crm_byw_activities(activity_date);
CREATE INDEX idx_crm_byw_activities_status ON public.crm_byw_activities(status);

-- ÉTAPE 4: Désactiver RLS complètement
ALTER TABLE public.crm_bot_one_activities DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_byw_activities DISABLE ROW LEVEL SECURITY;

-- ÉTAPE 5: Fonction handle_updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ÉTAPE 6: Triggers pour updated_at
CREATE TRIGGER handle_crm_bot_one_activities_updated_at
  BEFORE UPDATE ON public.crm_bot_one_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER handle_crm_byw_activities_updated_at
  BEFORE UPDATE ON public.crm_byw_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ÉTAPE 7: Fonction pour créer une activité Bot One
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

-- ÉTAPE 8: Fonction pour créer une activité BYW
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

-- ÉTAPE 9: Fonction pour récupérer les activités Bot One
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

-- ÉTAPE 10: Fonction pour récupérer les activités BYW
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

-- ÉTAPE 11: Test simple
DO $$
DECLARE
  test_record_id UUID;
  activity_id UUID;
BEGIN
  -- Créer un record de test Bot One
  INSERT INTO crm_bot_one_records (
    data,
    status
  ) VALUES (
    '{"Nom de l''entreprise": "Test Activities", "Nom contact": "Contact Test", "Email": "test@test.com", "Téléphone": "0123456789", "Site web": "https://test.com", "Statut": "prospect"}'::jsonb,
    'prospect'
  ) RETURNING id INTO test_record_id;
  
  -- Créer une activité
  SELECT create_bot_one_activity(
    test_record_id,
    'Test d''activité',
    'Description de test',
    NOW(),
    'call',
    'scheduled'
  ) INTO activity_id;
  
  IF activity_id IS NOT NULL THEN
    RAISE NOTICE '✓ Activité créée avec ID: %', activity_id;
  ELSE
    RAISE WARNING '✗ Échec de création d''activité';
  END IF;
  
  -- Nettoyer
  DELETE FROM crm_bot_one_records WHERE id = test_record_id;
  
  RAISE NOTICE 'Test terminé et nettoyé';
END $$;

-- Message de confirmation final
SELECT 
  'SYSTÈME D''ACTIVITÉS DÉPLOYÉ SANS RLS' as status,
  'Les activités Bot One et BYW fonctionnent maintenant' as message,
  NOW() as deployment_time;
