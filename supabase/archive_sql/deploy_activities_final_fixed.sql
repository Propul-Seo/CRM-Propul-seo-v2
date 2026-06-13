-- =====================================================
-- DÉPLOIEMENT FINAL DU SYSTÈME D'ACTIVITÉS (CORRIGÉ)
-- =====================================================

-- ÉTAPE 1: Supprimer les tables existantes si elles existent
DROP TABLE IF EXISTS public.crm_bot_one_activities CASCADE;
DROP TABLE IF EXISTS public.crm_byw_activities CASCADE;

-- ÉTAPE 2: Créer les tables d'activités avec les bonnes colonnes
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

-- ÉTAPE 4: Créer les fonctions RPC

-- Fonction pour créer une activité Bot One
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
BEGIN
  INSERT INTO public.crm_bot_one_activities (
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
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer une activité BYW
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
BEGIN
  INSERT INTO public.crm_byw_activities (
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
  
  RETURN activity_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour récupérer les activités Bot One
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
  FROM public.crm_bot_one_activities a
  WHERE a.bot_one_record_id = p_record_id
  ORDER BY a.activity_date DESC;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour récupérer les activités BYW
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
  FROM public.crm_byw_activities a
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
BEGIN
  UPDATE public.crm_bot_one_activities 
  SET 
    title = COALESCE(p_title, title),
    description = COALESCE(p_description, description),
    activity_date = COALESCE(p_activity_date, activity_date),
    type = COALESCE(p_type, type),
    status = COALESCE(p_status, status),
    updated_at = NOW()
  WHERE id = p_activity_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour une activité BYW
CREATE OR REPLACE FUNCTION public.update_byw_activity(
  p_activity_id UUID,
  p_title TEXT DEFAULT NULL,
  p_description TEXT DEFAULT NULL,
  p_activity_date TIMESTAMPTZ DEFAULT NULL,
  p_type TEXT DEFAULT NULL,
  p_status TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE public.crm_byw_activities 
  SET 
    title = COALESCE(p_title, title),
    description = COALESCE(p_description, description),
    activity_date = COALESCE(p_activity_date, activity_date),
    type = COALESCE(p_type, type),
    status = COALESCE(p_status, status),
    updated_at = NOW()
  WHERE id = p_activity_id;
  
  RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- ÉTAPE 5: Vérification
SELECT 'Tables et fonctions créées avec succès' as status;
