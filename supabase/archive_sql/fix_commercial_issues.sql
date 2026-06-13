-- =====================================================
-- CORRECTION DES PROBLÈMES COMMERCIAUX
-- =====================================================

-- 1. Vérifier et créer les tables si elles n'existent pas
CREATE TABLE IF NOT EXISTS commercial_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role TEXT DEFAULT 'calleur' CHECK (role IN ('calleur', 'manager', 'admin')),
  is_active BOOLEAN DEFAULT true,
  hire_date DATE DEFAULT CURRENT_DATE,
  target_calls_per_day INTEGER DEFAULT 50,
  target_rdv_per_week INTEGER DEFAULT 5,
  target_deals_per_month INTEGER DEFAULT 2,
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
  call_duration INTEGER,
  call_status TEXT DEFAULT 'completed' CHECK (call_status IN ('completed', 'no_answer', 'busy', 'voicemail')),
  call_result TEXT CHECK (call_result IN ('interested', 'not_interested', 'callback_requested', 'rdv_scheduled', 'do_not_call')),
  notes TEXT,
  follow_up_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commercial_meetings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calleur_id UUID REFERENCES commercial_users(id) ON DELETE CASCADE,
  lead_name TEXT NOT NULL,
  lead_phone TEXT,
  lead_email TEXT,
  meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
  meeting_duration INTEGER DEFAULT 60,
  meeting_status TEXT DEFAULT 'scheduled' CHECK (meeting_status IN ('scheduled', 'completed', 'cancelled', 'no_show')),
  meeting_result TEXT CHECK (meeting_result IN ('deal_closed', 'follow_up_needed', 'not_interested', 'proposal_sent')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commercial_deals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calleur_id UUID REFERENCES commercial_users(id) ON DELETE CASCADE,
  lead_name TEXT NOT NULL,
  lead_company TEXT,
  deal_value DECIMAL(10,2) NOT NULL,
  deal_status TEXT DEFAULT 'prospect' CHECK (deal_status IN ('prospect', 'proposal_sent', 'negotiation', 'closed_won', 'closed_lost')),
  deal_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expected_close_date DATE,
  actual_close_date DATE,
  commission_rate DECIMAL(5,2) DEFAULT 5.00,
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
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(calleur_id)
);

CREATE TABLE IF NOT EXISTS commercial_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT DEFAULT '🏆',
  points_required INTEGER DEFAULT 0,
  criteria_type TEXT CHECK (criteria_type IN ('calls', 'rdv', 'deals', 'streak', 'special')),
  criteria_value INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS commercial_user_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calleur_id UUID REFERENCES commercial_users(id) ON DELETE CASCADE,
  badge_id UUID REFERENCES commercial_badges(id) ON DELETE CASCADE,
  earned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(calleur_id, badge_id)
);

CREATE TABLE IF NOT EXISTS commercial_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calleur_id UUID REFERENCES commercial_users(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('target_missed', 'streak_broken', 'deal_opportunity', 'follow_up_due', 'performance_low')),
  alert_level TEXT DEFAULT 'info' CHECK (alert_level IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  is_resolved BOOLEAN DEFAULT false,
  is_dismissed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Désactiver temporairement RLS pour les tests
ALTER TABLE commercial_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_calls DISABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_meetings DISABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_deals DISABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_points DISABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_user_badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_alerts DISABLE ROW LEVEL SECURITY;

-- 3. Supprimer les anciennes politiques si elles existent
DROP POLICY IF EXISTS "Users can view their own commercial profile" ON commercial_users;
DROP POLICY IF EXISTS "Users can update their own commercial profile" ON commercial_users;
DROP POLICY IF EXISTS "Users can view their own calls" ON commercial_calls;
DROP POLICY IF EXISTS "Users can insert their own calls" ON commercial_calls;
DROP POLICY IF EXISTS "Users can update their own calls" ON commercial_calls;
DROP POLICY IF EXISTS "Users can view their own meetings" ON commercial_meetings;
DROP POLICY IF EXISTS "Users can insert their own meetings" ON commercial_meetings;
DROP POLICY IF EXISTS "Users can update their own meetings" ON commercial_meetings;
DROP POLICY IF EXISTS "Users can view their own deals" ON commercial_deals;
DROP POLICY IF EXISTS "Users can insert their own deals" ON commercial_deals;
DROP POLICY IF EXISTS "Users can update their own deals" ON commercial_deals;
DROP POLICY IF EXISTS "Users can view their own points" ON commercial_points;
DROP POLICY IF EXISTS "Everyone can view badges" ON commercial_badges;
DROP POLICY IF EXISTS "Users can view their own badges" ON commercial_user_badges;
DROP POLICY IF EXISTS "Users can view their own alerts" ON commercial_alerts;
DROP POLICY IF EXISTS "Users can update their own alerts" ON commercial_alerts;

-- 4. Créer des politiques RLS simplifiées
ALTER TABLE commercial_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_alerts ENABLE ROW LEVEL SECURITY;

-- Politiques permissives pour les tests
CREATE POLICY "Allow all operations on commercial_users" ON commercial_users
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on commercial_calls" ON commercial_calls
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on commercial_meetings" ON commercial_meetings
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on commercial_deals" ON commercial_deals
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on commercial_points" ON commercial_points
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on commercial_badges" ON commercial_badges
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on commercial_user_badges" ON commercial_user_badges
  FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on commercial_alerts" ON commercial_alerts
  FOR ALL USING (true) WITH CHECK (true);

-- 5. Insérer des badges par défaut
INSERT INTO commercial_badges (name, description, icon, points_required, criteria_type, criteria_value) VALUES
('Premier Appel', 'Effectuer votre premier appel', '📞', 10, 'calls', 1),
('Appel du Jour', 'Effectuer 50 appels en une journée', '🎯', 50, 'calls', 50),
('Premier RDV', 'Planifier votre premier rendez-vous', '📅', 25, 'rdv', 1),
('Premier Deal', 'Fermer votre premier deal', '💰', 200, 'deals', 1),
('Champion Commercial', 'Atteindre 1000 points', '👑', 1000, 'special', 0)
ON CONFLICT DO NOTHING;

-- 6. Créer les fonctions SQL manquantes
CREATE OR REPLACE FUNCTION get_commercial_kpis(date_from TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days')
RETURNS TABLE (
  calleur_id UUID,
  calleur_name TEXT,
  period TEXT,
  calls_count BIGINT,
  calls_target INTEGER,
  calls_percentage NUMERIC,
  rdv_count BIGINT,
  rdv_target INTEGER,
  rdv_percentage NUMERIC,
  deals_count BIGINT,
  deals_target INTEGER,
  deals_percentage NUMERIC,
  deals_value NUMERIC,
  conversion_rate NUMERIC,
  show_up_rate NUMERIC,
  points_total INTEGER,
  level INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cu.id as calleur_id,
    cu.name as calleur_name,
    '30d' as period,
    COALESCE(call_stats.calls_count, 0) as calls_count,
    cu.target_calls_per_day * 30 as calls_target,
    CASE 
      WHEN cu.target_calls_per_day > 0 THEN 
        ROUND((COALESCE(call_stats.calls_count, 0)::NUMERIC / (cu.target_calls_per_day * 30)) * 100, 1)
      ELSE 0
    END as calls_percentage,
    COALESCE(meeting_stats.rdv_count, 0) as rdv_count,
    cu.target_rdv_per_week * 4 as rdv_target,
    CASE 
      WHEN cu.target_rdv_per_week > 0 THEN 
        ROUND((COALESCE(meeting_stats.rdv_count, 0)::NUMERIC / (cu.target_rdv_per_week * 4)) * 100, 1)
      ELSE 0
    END as rdv_percentage,
    COALESCE(deal_stats.deals_count, 0) as deals_count,
    cu.target_deals_per_month as deals_target,
    CASE 
      WHEN cu.target_deals_per_month > 0 THEN 
        ROUND((COALESCE(deal_stats.deals_count, 0)::NUMERIC / cu.target_deals_per_month) * 100, 1)
      ELSE 0
    END as deals_percentage,
    COALESCE(deal_stats.deals_value, 0) as deals_value,
    CASE 
      WHEN COALESCE(call_stats.calls_count, 0) > 0 THEN 
        ROUND((COALESCE(meeting_stats.rdv_count, 0)::NUMERIC / call_stats.calls_count) * 100, 1)
      ELSE 0
    END as conversion_rate,
    CASE 
      WHEN COALESCE(meeting_stats.rdv_count, 0) > 0 THEN 
        ROUND((COALESCE(meeting_stats.completed_rdv, 0)::NUMERIC / meeting_stats.rdv_count) * 100, 1)
      ELSE 0
    END as show_up_rate,
    COALESCE(points.points_total, 0) as points_total,
    COALESCE(points.level, 1) as level
  FROM commercial_users cu
  LEFT JOIN (
    SELECT 
      calleur_id,
      COUNT(*) as calls_count
    FROM commercial_calls
    WHERE call_date >= date_from
    GROUP BY calleur_id
  ) call_stats ON cu.id = call_stats.calleur_id
  LEFT JOIN (
    SELECT 
      calleur_id,
      COUNT(*) as rdv_count,
      COUNT(*) FILTER (WHERE meeting_status = 'completed') as completed_rdv
    FROM commercial_meetings
    WHERE meeting_date >= date_from
    GROUP BY calleur_id
  ) meeting_stats ON cu.id = meeting_stats.calleur_id
  LEFT JOIN (
    SELECT 
      calleur_id,
      COUNT(*) FILTER (WHERE deal_status = 'closed_won') as deals_count,
      SUM(deal_value) FILTER (WHERE deal_status = 'closed_won') as deals_value
    FROM commercial_deals
    WHERE deal_date >= date_from
    GROUP BY calleur_id
  ) deal_stats ON cu.id = deal_stats.calleur_id
  LEFT JOIN commercial_points points ON cu.id = points.calleur_id
  WHERE cu.is_active = true
  ORDER BY points_total DESC, calls_count DESC;
END;
$$ LANGUAGE plpgsql;

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
    cu.id as calleur_id,
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
    30 as average_sales_cycle,
    COALESCE(points.points_total, 0) as points_total,
    COALESCE(points.level, 1) as level,
    COALESCE(badge_stats.badges_count, 0) as badges_count
  FROM commercial_users cu
  LEFT JOIN (
    SELECT 
      calleur_id,
      COUNT(*) as total_calls
    FROM commercial_calls
    GROUP BY calleur_id
  ) call_stats ON cu.id = call_stats.calleur_id
  LEFT JOIN (
    SELECT 
      calleur_id,
      COUNT(*) as total_rdv,
      COUNT(*) FILTER (WHERE meeting_status = 'completed') as completed_rdv
    FROM commercial_meetings
    GROUP BY calleur_id
  ) meeting_stats ON cu.id = meeting_stats.calleur_id
  LEFT JOIN (
    SELECT 
      calleur_id,
      COUNT(*) FILTER (WHERE deal_status = 'closed_won') as total_deals,
      SUM(deal_value) FILTER (WHERE deal_status = 'closed_won') as total_deals_value
    FROM commercial_deals
    GROUP BY calleur_id
  ) deal_stats ON cu.id = deal_stats.calleur_id
  LEFT JOIN commercial_points points ON cu.id = points.calleur_id
  LEFT JOIN (
    SELECT 
      calleur_id,
      COUNT(*) as badges_count
    FROM commercial_user_badges
    GROUP BY calleur_id
  ) badge_stats ON cu.id = badge_stats.calleur_id
  WHERE cu.id = input_calleur_id;
END;
$$ LANGUAGE plpgsql;

-- 7. Créer les triggers pour les timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_commercial_users_updated_at ON commercial_users;
DROP TRIGGER IF EXISTS update_commercial_calls_updated_at ON commercial_calls;
DROP TRIGGER IF EXISTS update_commercial_meetings_updated_at ON commercial_meetings;
DROP TRIGGER IF EXISTS update_commercial_deals_updated_at ON commercial_deals;
DROP TRIGGER IF EXISTS update_commercial_points_updated_at ON commercial_points;
DROP TRIGGER IF EXISTS update_commercial_alerts_updated_at ON commercial_alerts;

CREATE TRIGGER update_commercial_users_updated_at BEFORE UPDATE ON commercial_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commercial_calls_updated_at BEFORE UPDATE ON commercial_calls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commercial_meetings_updated_at BEFORE UPDATE ON commercial_meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commercial_deals_updated_at BEFORE UPDATE ON commercial_deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commercial_points_updated_at BEFORE UPDATE ON commercial_points FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commercial_alerts_updated_at BEFORE UPDATE ON commercial_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. Fonction pour créer automatiquement un profil de points
CREATE OR REPLACE FUNCTION create_commercial_points_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO commercial_points (calleur_id, points_total, points_calls, points_rdv, points_deals, points_bonus, level)
  VALUES (NEW.id, 0, 0, 0, 0, 0, 1)
  ON CONFLICT (calleur_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_points_profile ON commercial_users;
CREATE TRIGGER trigger_create_points_profile
  AFTER INSERT ON commercial_users
  FOR EACH ROW EXECUTE FUNCTION create_commercial_points_profile();
