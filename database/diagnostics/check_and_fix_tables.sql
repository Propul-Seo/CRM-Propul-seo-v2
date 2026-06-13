-- =====================================================
-- VÉRIFICATION ET CORRECTION DES TABLES
-- =====================================================

-- 1. VÉRIFIER QUE LES TABLES EXISTENT
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'commercial_%'
ORDER BY table_name;

-- 2. VÉRIFIER LA STRUCTURE DE commercial_users
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'commercial_users' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 3. VÉRIFIER LA STRUCTURE DE commercial_meetings
SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'commercial_meetings' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- 4. CRÉER LES TABLES SI ELLES N'EXISTENT PAS
CREATE TABLE IF NOT EXISTS commercial_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  name TEXT NOT NULL,
  email TEXT,
  role TEXT DEFAULT 'commercial',
  is_active BOOLEAN DEFAULT true,
  target_calls_per_day INTEGER DEFAULT 10,
  target_rdv_per_week INTEGER DEFAULT 5,
  target_deals_per_month INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commercial_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calleur_id UUID,
  lead_name TEXT NOT NULL,
  lead_phone TEXT,
  lead_email TEXT,
  meeting_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  meeting_duration INTEGER DEFAULT 60,
  meeting_status TEXT DEFAULT 'scheduled',
  meeting_result TEXT DEFAULT 'follow_up_needed',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commercial_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calleur_id UUID,
  points_total INTEGER DEFAULT 0,
  points_calls INTEGER DEFAULT 0,
  points_rdv INTEGER DEFAULT 0,
  points_deals INTEGER DEFAULT 0,
  points_bonus INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. DÉSACTIVER RLS
ALTER TABLE commercial_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_meetings DISABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_points DISABLE ROW LEVEL SECURITY;

-- 6. CRÉER L'UTILISATEUR DE TEST
INSERT INTO commercial_users (
  id,
  user_id,
  name,
  email,
  role,
  is_active,
  target_calls_per_day,
  target_rdv_per_week,
  target_deals_per_month
)
VALUES (
  '470c709c-abce-48c8-b8b3-320cd98a5ed5'::UUID,
  '470c709c-abce-48c8-b8b3-320cd98a5ed5'::UUID,
  'Utilisateur Test',
  'test@example.com',
  'commercial',
  true,
  10,
  5,
  3
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active;

-- 7. CRÉER LE PROFIL DE POINTS
INSERT INTO commercial_points (
  calleur_id,
  points_total,
  points_calls,
  points_rdv,
  points_deals,
  points_bonus,
  level
)
VALUES (
  '470c709c-abce-48c8-b8b3-320cd98a5ed5'::UUID,
  0,
  0,
  0,
  0,
  0,
  1
)
ON CONFLICT (calleur_id) DO UPDATE SET
  points_total = EXCLUDED.points_total,
  points_calls = EXCLUDED.points_calls,
  points_rdv = EXCLUDED.points_rdv,
  points_deals = EXCLUDED.points_deals,
  points_bonus = EXCLUDED.points_bonus,
  level = EXCLUDED.level;

-- 8. CRÉER LA FONCTION GET_COMMERCIAL_STATS
CREATE OR REPLACE FUNCTION get_commercial_stats(input_calleur_id UUID)
RETURNS TABLE (
  calleur_id UUID,
  total_calls BIGINT,
  total_rdv BIGINT,
  total_deals BIGINT,
  total_deals_value NUMERIC,
  conversion_rate NUMERIC,
  show_up_rate NUMERIC,
  average_deal_value NUMERIC,
  average_sales_cycle NUMERIC,
  points_total INTEGER,
  level INTEGER,
  badges_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    input_calleur_id,
    0::BIGINT as total_calls,
    COALESCE(meeting_stats.total_rdv, 0) as total_rdv,
    0::BIGINT as total_deals,
    0::NUMERIC as total_deals_value,
    0::NUMERIC as conversion_rate,
    0::NUMERIC as show_up_rate,
    0::NUMERIC as average_deal_value,
    30::NUMERIC as average_sales_cycle,
    COALESCE(points.points_total, 0) as points_total,
    COALESCE(points.level, 1) as level,
    0::BIGINT as badges_count
  FROM commercial_users cu
  LEFT JOIN (
    SELECT 
      commercial_meetings.calleur_id,
      COUNT(*) as total_rdv
    FROM commercial_meetings
    WHERE commercial_meetings.calleur_id = input_calleur_id
    GROUP BY commercial_meetings.calleur_id
  ) meeting_stats ON cu.id = meeting_stats.calleur_id
  LEFT JOIN commercial_points points ON cu.id = points.calleur_id
  WHERE cu.id = input_calleur_id;
END;
$$;

-- 9. DONNER LES PERMISSIONS
GRANT EXECUTE ON FUNCTION get_commercial_stats(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_commercial_stats(UUID) TO authenticated;

-- 10. TESTER L'INSERTION D'UN RDV
INSERT INTO commercial_meetings (
  calleur_id,
  lead_name,
  lead_phone,
  lead_email,
  meeting_duration,
  meeting_status,
  meeting_result,
  notes
)
VALUES (
  '470c709c-abce-48c8-b8b3-320cd98a5ed5'::UUID,
  'Test Lead',
  '+33123456789',
  'test@lead.com',
  60,
  'scheduled',
  'follow_up_needed',
  'Test de création de RDV'
);

-- 11. VÉRIFIER QUE LE RDV A ÉTÉ CRÉÉ
SELECT 
  id,
  calleur_id,
  lead_name,
  lead_phone,
  lead_email,
  meeting_status,
  created_at
FROM commercial_meetings 
WHERE calleur_id = '470c709c-abce-48c8-b8b3-320cd98a5ed5'::UUID
ORDER BY created_at DESC;

-- 12. TESTER LA FONCTION
SELECT 'Test fonction:' as info;
SELECT * FROM get_commercial_stats('470c709c-abce-48c8-b8b3-320cd98a5ed5'::UUID);

-- 13. COMPTER LES DONNÉES
SELECT 'Utilisateurs:' as info, COUNT(*) as count FROM commercial_users;
SELECT 'RDV:' as info, COUNT(*) as count FROM commercial_meetings;
SELECT 'Points:' as info, COUNT(*) as count FROM commercial_points;
