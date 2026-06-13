-- =====================================================
-- CORRECTION COMPLÈTE DE TOUS LES PROBLÈMES COMMERCIAUX
-- =====================================================

-- 1. Créer toutes les tables si elles n'existent pas
CREATE TABLE IF NOT EXISTS commercial_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'commercial',
  is_active BOOLEAN DEFAULT true,
  target_calls_per_day INTEGER DEFAULT 10,
  target_rdv_per_week INTEGER DEFAULT 5,
  target_deals_per_month INTEGER DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commercial_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calleur_id UUID REFERENCES commercial_users(id) ON DELETE CASCADE,
  lead_name TEXT NOT NULL,
  lead_phone TEXT,
  lead_email TEXT,
  call_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  call_duration INTEGER DEFAULT 0,
  call_status TEXT DEFAULT 'completed',
  call_result TEXT DEFAULT 'interested',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commercial_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calleur_id UUID REFERENCES commercial_users(id) ON DELETE CASCADE,
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

CREATE TABLE IF NOT EXISTS commercial_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calleur_id UUID REFERENCES commercial_users(id) ON DELETE CASCADE,
  lead_name TEXT NOT NULL,
  lead_company TEXT,
  deal_value DECIMAL(10,2) DEFAULT 0,
  deal_status TEXT DEFAULT 'prospect',
  deal_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expected_close_date DATE,
  closed_at TIMESTAMP WITH TIME ZONE,
  commission_rate DECIMAL(5,2) DEFAULT 5.0,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commercial_points (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calleur_id UUID REFERENCES commercial_users(id) ON DELETE CASCADE,
  points_total INTEGER DEFAULT 0,
  points_calls INTEGER DEFAULT 0,
  points_rdv INTEGER DEFAULT 0,
  points_deals INTEGER DEFAULT 0,
  points_bonus INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commercial_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  points_required INTEGER DEFAULT 0,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commercial_user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calleur_id UUID REFERENCES commercial_users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES commercial_badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(calleur_id, badge_id)
);

CREATE TABLE IF NOT EXISTS commercial_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calleur_id UUID REFERENCES commercial_users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT,
  is_read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Désactiver RLS pour toutes les tables
ALTER TABLE commercial_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_calls DISABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_meetings DISABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_deals DISABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_points DISABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_user_badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_alerts DISABLE ROW LEVEL SECURITY;

-- 3. Supprimer les anciennes fonctions
DROP FUNCTION IF EXISTS get_commercial_stats(UUID);
DROP FUNCTION IF EXISTS get_commercial_kpis(TIMESTAMP WITH TIME ZONE);
DROP FUNCTION IF EXISTS get_commercial_leaderboard(TIMESTAMP WITH TIME ZONE);
DROP FUNCTION IF EXISTS get_commercial_chart_data(TIMESTAMP WITH TIME ZONE);

-- 4. Créer les fonctions SQL
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
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    input_calleur_id,
    COALESCE(call_stats.total_calls, 0) as total_calls,
    COALESCE(meeting_stats.total_rdv, 0) as total_rdv,
    COALESCE(deal_stats.total_deals, 0) as total_deals,
    COALESCE(deal_stats.total_deals_value, 0) as total_deals_value,
    CASE 
      WHEN COALESCE(call_stats.total_calls, 0) > 0 THEN 
        ROUND((COALESCE(meeting_stats.total_rdv, 0)::NUMERIC / call_stats.total_calls) * 100, 1)
      ELSE 0
    END as conversion_rate,
    CASE 
      WHEN COALESCE(meeting_stats.total_rdv, 0) > 0 THEN 
        ROUND((COALESCE(meeting_stats.completed_rdv, 0)::NUMERIC / meeting_stats.total_rdv) * 100, 1)
      ELSE 0
    END as show_up_rate,
    CASE 
      WHEN COALESCE(deal_stats.total_deals, 0) > 0 THEN 
        ROUND(deal_stats.total_deals_value / deal_stats.total_deals, 2)
      ELSE 0
    END as average_deal_value,
    30::NUMERIC as average_sales_cycle,
    COALESCE(points.points_total, 0) as points_total,
    COALESCE(points.level, 1) as level,
    COALESCE(badge_stats.badges_count, 0) as badges_count
  FROM commercial_users cu
  LEFT JOIN (
    SELECT 
      commercial_calls.calleur_id,
      COUNT(*) as total_calls
    FROM commercial_calls
    WHERE commercial_calls.calleur_id = input_calleur_id
    GROUP BY commercial_calls.calleur_id
  ) call_stats ON cu.id = call_stats.calleur_id
  LEFT JOIN (
    SELECT 
      commercial_meetings.calleur_id,
      COUNT(*) as total_rdv,
      COUNT(*) FILTER (WHERE commercial_meetings.meeting_status = 'completed') as completed_rdv
    FROM commercial_meetings
    WHERE commercial_meetings.calleur_id = input_calleur_id
    GROUP BY commercial_meetings.calleur_id
  ) meeting_stats ON cu.id = meeting_stats.calleur_id
  LEFT JOIN (
    SELECT 
      commercial_deals.calleur_id,
      COUNT(*) FILTER (WHERE commercial_deals.deal_status = 'closed_won') as total_deals,
      SUM(commercial_deals.deal_value) FILTER (WHERE commercial_deals.deal_status = 'closed_won') as total_deals_value
    FROM commercial_deals
    WHERE commercial_deals.calleur_id = input_calleur_id
    GROUP BY commercial_deals.calleur_id
  ) deal_stats ON cu.id = deal_stats.calleur_id
  LEFT JOIN commercial_points points ON cu.id = points.calleur_id
  LEFT JOIN (
    SELECT 
      commercial_user_badges.calleur_id,
      COUNT(*) as badges_count
    FROM commercial_user_badges
    WHERE commercial_user_badges.calleur_id = input_calleur_id
    GROUP BY commercial_user_badges.calleur_id
  ) badge_stats ON cu.id = badge_stats.calleur_id
  WHERE cu.id = input_calleur_id;
END;
$$ LANGUAGE plpgsql;

-- 5. Créer l'utilisateur de test
INSERT INTO commercial_users (
  id,
  user_id,
  name,
  email,
  role,
  is_active,
  target_calls_per_day,
  target_rdv_per_week,
  target_deals_per_month,
  created_at,
  updated_at
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
  3,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 6. Créer le profil de points pour l'utilisateur de test
INSERT INTO commercial_points (
  calleur_id,
  points_total,
  points_calls,
  points_rdv,
  points_deals,
  points_bonus,
  level,
  created_at,
  updated_at
)
VALUES (
  '470c709c-abce-48c8-b8b3-320cd98a5ed5'::UUID,
  0,
  0,
  0,
  0,
  0,
  1,
  NOW(),
  NOW()
)
ON CONFLICT (calleur_id) DO UPDATE SET
  points_total = EXCLUDED.points_total,
  points_calls = EXCLUDED.points_calls,
  points_rdv = EXCLUDED.points_rdv,
  points_deals = EXCLUDED.points_deals,
  points_bonus = EXCLUDED.points_bonus,
  level = EXCLUDED.level,
  updated_at = NOW();

-- 7. Insérer des badges par défaut
INSERT INTO commercial_badges (name, description, icon, points_required, category)
VALUES 
  ('Premier Appel', 'Effectuer votre premier appel', '📞', 10, 'calls'),
  ('Premier RDV', 'Planifier votre premier rendez-vous', '📅', 25, 'meetings'),
  ('Premier Deal', 'Fermer votre premier deal', '💰', 100, 'deals'),
  ('Vendeur du Mois', 'Être le meilleur vendeur du mois', '🏆', 500, 'achievement')
ON CONFLICT DO NOTHING;

-- 8. Tester que tout fonctionne
SELECT 'Test get_commercial_stats:' as test_name;
SELECT * FROM get_commercial_stats('470c709c-abce-48c8-b8b3-320cd98a5ed5'::UUID);

-- 9. Vérifier les données créées
SELECT 'Utilisateurs créés:' as info;
SELECT COUNT(*) as total_users FROM commercial_users;

SELECT 'Points créés:' as info;
SELECT COUNT(*) as total_points FROM commercial_points;

SELECT 'Badges créés:' as info;
SELECT COUNT(*) as total_badges FROM commercial_badges;
