-- =====================================================
-- CRÉATION DE LA TABLE D'ACTIVITÉS UTILISATEURS
-- =====================================================
-- Table simple pour stocker les RDV et appels quotidiens
-- directement liée à la table users

-- 1. Créer la table des activités utilisateurs
CREATE TABLE IF NOT EXISTS user_activities (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'meeting')),
  lead_name TEXT NOT NULL,
  lead_phone TEXT,
  lead_email TEXT,
  activity_date TIMESTAMPTZ DEFAULT NOW(),
  duration INTEGER DEFAULT 0, -- en minutes pour les RDV, en secondes pour les appels
  status TEXT DEFAULT 'completed' CHECK (status IN ('completed', 'scheduled', 'cancelled', 'no_show')),
  result TEXT, -- 'interested', 'not_interested', 'callback_requested', 'rdv_scheduled', 'deal_closed', etc.
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Créer des index pour optimiser les requêtes
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_date ON user_activities(activity_date);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON user_activities(activity_type);

-- 3. Créer une fonction pour compter les activités par utilisateur et par jour
CREATE OR REPLACE FUNCTION get_user_daily_stats(input_user_id UUID, target_date DATE DEFAULT CURRENT_DATE)
RETURNS TABLE (
  user_id UUID,
  date DATE,
  calls_count BIGINT,
  meetings_count BIGINT,
  total_activities BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    input_user_id,
    target_date,
    COALESCE(calls.calls_count, 0) as calls_count,
    COALESCE(meetings.meetings_count, 0) as meetings_count,
    COALESCE(calls.calls_count, 0) + COALESCE(meetings.meetings_count, 0) as total_activities
  FROM (
    SELECT COUNT(*) as calls_count
    FROM user_activities 
    WHERE user_activities.user_id = input_user_id 
    AND user_activities.activity_type = 'call'
    AND DATE(user_activities.activity_date) = target_date
  ) calls
  CROSS JOIN (
    SELECT COUNT(*) as meetings_count
    FROM user_activities 
    WHERE user_activities.user_id = input_user_id 
    AND user_activities.activity_type = 'meeting'
    AND DATE(user_activities.activity_date) = target_date
  ) meetings;
END;
$$;

-- 4. Créer une fonction pour récupérer les statistiques globales d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_stats(input_user_id UUID)
RETURNS TABLE (
  user_id UUID,
  total_calls BIGINT,
  total_meetings BIGINT,
  total_activities BIGINT,
  last_activity_date TIMESTAMPTZ
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    input_user_id,
    COALESCE(calls.total_calls, 0) as total_calls,
    COALESCE(meetings.total_meetings, 0) as total_meetings,
    COALESCE(calls.total_calls, 0) + COALESCE(meetings.total_meetings, 0) as total_activities,
    activities.last_activity_date
  FROM (
    SELECT COUNT(*) as total_calls
    FROM user_activities 
    WHERE user_activities.user_id = input_user_id 
    AND user_activities.activity_type = 'call'
  ) calls
  CROSS JOIN (
    SELECT COUNT(*) as total_meetings
    FROM user_activities 
    WHERE user_activities.user_id = input_user_id 
    AND user_activities.activity_type = 'meeting'
  ) meetings
  CROSS JOIN (
    SELECT MAX(activity_date) as last_activity_date
    FROM user_activities 
    WHERE user_activities.user_id = input_user_id
  ) activities;
END;
$$;

-- 5. Donner les permissions nécessaires
GRANT SELECT, INSERT, UPDATE, DELETE ON user_activities TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_daily_stats(UUID, DATE) TO authenticated;
GRANT EXECUTE ON FUNCTION get_user_stats(UUID) TO authenticated;

-- 6. Activer RLS (Row Level Security)
ALTER TABLE user_activities ENABLE ROW LEVEL SECURITY;

-- 7. Créer les politiques RLS
CREATE POLICY "Users can view their own activities" ON user_activities
  FOR SELECT USING (auth.uid()::text = user_id::text);

CREATE POLICY "Users can insert their own activities" ON user_activities
  FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

CREATE POLICY "Users can update their own activities" ON user_activities
  FOR UPDATE USING (auth.uid()::text = user_id::text);

-- 8. Tester la création
SELECT 'Table user_activities créée avec succès' as status;

-- 9. Afficher la structure de la table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'user_activities' 
ORDER BY ordinal_position;
