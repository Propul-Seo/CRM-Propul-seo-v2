-- Tables commerciales de base
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

-- Activer RLS
ALTER TABLE commercial_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_alerts ENABLE ROW LEVEL SECURITY;

-- Politiques de base
CREATE POLICY "Users can view their own commercial profile" ON commercial_users
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own commercial profile" ON commercial_users
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own calls" ON commercial_calls
  FOR SELECT USING (
    calleur_id IN (
      SELECT id FROM commercial_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own calls" ON commercial_calls
  FOR INSERT WITH CHECK (
    calleur_id IN (
      SELECT id FROM commercial_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own calls" ON commercial_calls
  FOR UPDATE USING (
    calleur_id IN (
      SELECT id FROM commercial_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own meetings" ON commercial_meetings
  FOR SELECT USING (
    calleur_id IN (
      SELECT id FROM commercial_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own meetings" ON commercial_meetings
  FOR INSERT WITH CHECK (
    calleur_id IN (
      SELECT id FROM commercial_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own meetings" ON commercial_meetings
  FOR UPDATE USING (
    calleur_id IN (
      SELECT id FROM commercial_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own deals" ON commercial_deals
  FOR SELECT USING (
    calleur_id IN (
      SELECT id FROM commercial_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own deals" ON commercial_deals
  FOR INSERT WITH CHECK (
    calleur_id IN (
      SELECT id FROM commercial_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own deals" ON commercial_deals
  FOR UPDATE USING (
    calleur_id IN (
      SELECT id FROM commercial_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own points" ON commercial_points
  FOR SELECT USING (
    calleur_id IN (
      SELECT id FROM commercial_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Everyone can view badges" ON commercial_badges
  FOR SELECT USING (true);

CREATE POLICY "Users can view their own badges" ON commercial_user_badges
  FOR SELECT USING (
    calleur_id IN (
      SELECT id FROM commercial_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can view their own alerts" ON commercial_alerts
  FOR SELECT USING (
    calleur_id IN (
      SELECT id FROM commercial_users WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own alerts" ON commercial_alerts
  FOR UPDATE USING (
    calleur_id IN (
      SELECT id FROM commercial_users WHERE user_id = auth.uid()
    )
  );

-- Badges par défaut
INSERT INTO commercial_badges (name, description, icon, points_required, criteria_type, criteria_value) VALUES
('Premier Appel', 'Effectuer votre premier appel', '📞', 10, 'calls', 1),
('Appel du Jour', 'Effectuer 50 appels en une journée', '🎯', 50, 'calls', 50),
('Premier RDV', 'Planifier votre premier rendez-vous', '📅', 25, 'rdv', 1),
('Premier Deal', 'Fermer votre premier deal', '💰', 200, 'deals', 1),
('Champion Commercial', 'Atteindre 1000 points', '👑', 1000, 'special', 0);

-- Triggers pour les timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_commercial_users_updated_at BEFORE UPDATE ON commercial_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commercial_calls_updated_at BEFORE UPDATE ON commercial_calls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commercial_meetings_updated_at BEFORE UPDATE ON commercial_meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commercial_deals_updated_at BEFORE UPDATE ON commercial_deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commercial_points_updated_at BEFORE UPDATE ON commercial_points FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commercial_alerts_updated_at BEFORE UPDATE ON commercial_alerts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
