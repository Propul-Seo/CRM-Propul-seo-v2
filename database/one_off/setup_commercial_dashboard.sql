-- =====================================================
-- DASHBOARD COMMERCIAL - TABLES KPIs
-- =====================================================
-- Script de création des tables pour le suivi d'activité commerciale
-- À exécuter dans le SQL Editor de Supabase

-- 1. Table des calleurs (utilisateurs commerciaux)
CREATE TABLE IF NOT EXISTS commercial_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(100) DEFAULT 'calleur', -- 'calleur', 'manager', 'admin'
    team VARCHAR(100), -- 'site', 'seo', 'bot', 'byw'
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Table des appels commerciaux
CREATE TABLE IF NOT EXISTS commercial_calls (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    calleur_id UUID REFERENCES commercial_users(id) ON DELETE CASCADE,
    lead_id UUID, -- Référence vers le lead dans les CRMs
    lead_source VARCHAR(100), -- 'bot_one', 'byw', 'site', 'seo'
    lead_name VARCHAR(255),
    lead_phone VARCHAR(50),
    lead_email VARCHAR(255),
    
    -- Détails de l'appel
    call_date TIMESTAMP WITH TIME ZONE NOT NULL,
    call_duration INTEGER, -- Durée en secondes
    call_status VARCHAR(50) NOT NULL, -- 'answered', 'no_answer', 'busy', 'voicemail', 'wrong_number'
    call_outcome VARCHAR(50), -- 'rdv_scheduled', 'callback_requested', 'not_interested', 'wrong_number', 'no_answer'
    
    -- Qualité de l'appel
    lead_quality VARCHAR(50), -- 'hot', 'warm', 'cold'
    interest_level INTEGER CHECK (interest_level >= 1 AND interest_level <= 5), -- 1-5 échelle
    notes TEXT,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Table des RDV planifiés
CREATE TABLE IF NOT EXISTS commercial_meetings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    calleur_id UUID REFERENCES commercial_users(id) ON DELETE CASCADE,
    lead_id UUID,
    lead_source VARCHAR(100),
    lead_name VARCHAR(255),
    lead_phone VARCHAR(50),
    lead_email VARCHAR(255),
    
    -- Détails du RDV
    meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
    meeting_type VARCHAR(50) DEFAULT 'demo', -- 'demo', 'presentation', 'call', 'visit'
    meeting_status VARCHAR(50) DEFAULT 'scheduled', -- 'scheduled', 'completed', 'cancelled', 'rescheduled', 'no_show'
    meeting_duration INTEGER, -- Durée prévue en minutes
    
    -- Suivi du RDV
    show_up BOOLEAN, -- Présent ou absent
    meeting_outcome VARCHAR(50), -- 'converted', 'follow_up', 'not_interested', 'cancelled'
    conversion_value DECIMAL(10,2), -- Valeur du deal si converti
    follow_up_date TIMESTAMP WITH TIME ZONE,
    
    -- Métadonnées
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Table des deals/opportunités
CREATE TABLE IF NOT EXISTS commercial_deals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    calleur_id UUID REFERENCES commercial_users(id) ON DELETE CASCADE,
    lead_id UUID,
    lead_source VARCHAR(100),
    lead_name VARCHAR(255),
    
    -- Détails du deal
    deal_value DECIMAL(10,2) NOT NULL,
    deal_status VARCHAR(50) DEFAULT 'prospect', -- 'prospect', 'qualified', 'proposal', 'negotiation', 'closed_won', 'closed_lost'
    deal_probability INTEGER CHECK (deal_probability >= 0 AND deal_probability <= 100), -- 0-100%
    
    -- Cycle de vente
    first_contact_date TIMESTAMP WITH TIME ZONE,
    qualification_date TIMESTAMP WITH TIME ZONE,
    proposal_date TIMESTAMP WITH TIME ZONE,
    closing_date TIMESTAMP WITH TIME ZONE,
    
    -- Détails du service
    service_type VARCHAR(100), -- 'site', 'seo', 'bot', 'byw', 'combo'
    contract_duration INTEGER, -- Durée en mois
    monthly_value DECIMAL(10,2), -- Valeur mensuelle
    
    -- Métadonnées
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Table des KPIs quotidiens (agrégation)
CREATE TABLE IF NOT EXISTS commercial_kpis_daily (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    calleur_id UUID REFERENCES commercial_users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    
    -- KPIs Volume
    calls_made INTEGER DEFAULT 0,
    calls_answered INTEGER DEFAULT 0,
    calls_duration_total INTEGER DEFAULT 0, -- Total en secondes
    
    -- KPIs Conversion
    rdv_scheduled INTEGER DEFAULT 0,
    rdv_completed INTEGER DEFAULT 0,
    rdv_no_show INTEGER DEFAULT 0,
    conversion_rate DECIMAL(5,2) DEFAULT 0, -- RDV scheduled / calls answered
    
    -- KPIs Qualité
    hot_leads INTEGER DEFAULT 0,
    warm_leads INTEGER DEFAULT 0,
    cold_leads INTEGER DEFAULT 0,
    average_interest_level DECIMAL(3,2) DEFAULT 0,
    
    -- KPIs Performance
    deals_closed INTEGER DEFAULT 0,
    deals_value DECIMAL(10,2) DEFAULT 0,
    deals_lost INTEGER DEFAULT 0,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(calleur_id, date)
);

-- 6. Table des objectifs commerciaux
CREATE TABLE IF NOT EXISTS commercial_targets (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    calleur_id UUID REFERENCES commercial_users(id) ON DELETE CASCADE,
    period_type VARCHAR(20) NOT NULL, -- 'daily', 'weekly', 'monthly', 'yearly'
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    
    -- Objectifs quantitatifs
    target_calls INTEGER DEFAULT 0,
    target_rdv INTEGER DEFAULT 0,
    target_deals INTEGER DEFAULT 0,
    target_revenue DECIMAL(10,2) DEFAULT 0,
    
    -- Objectifs qualitatifs
    target_conversion_rate DECIMAL(5,2) DEFAULT 0,
    target_show_up_rate DECIMAL(5,2) DEFAULT 0,
    
    -- Métadonnées
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Table des points et gamification
CREATE TABLE IF NOT EXISTS commercial_points (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    calleur_id UUID REFERENCES commercial_users(id) ON DELETE CASCADE,
    points INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    
    -- Détail des points
    points_calls INTEGER DEFAULT 0,
    points_rdv INTEGER DEFAULT 0,
    points_deals INTEGER DEFAULT 0,
    points_bonus INTEGER DEFAULT 0,
    
    -- Badges et récompenses
    badges TEXT[] DEFAULT ARRAY[]::TEXT[],
    last_badge_date TIMESTAMP WITH TIME ZONE,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 8. Table des alertes et notifications
CREATE TABLE IF NOT EXISTS commercial_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    calleur_id UUID REFERENCES commercial_users(id) ON DELETE CASCADE,
    alert_type VARCHAR(50) NOT NULL, -- 'performance_drop', 'goal_at_risk', 'lead_not_contacted', 'rdv_no_followup'
    alert_level VARCHAR(20) DEFAULT 'info', -- 'info', 'warning', 'critical'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Détails de l'alerte
    threshold_value DECIMAL(10,2),
    current_value DECIMAL(10,2),
    is_read BOOLEAN DEFAULT FALSE,
    is_resolved BOOLEAN DEFAULT FALSE,
    
    -- Métadonnées
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- =====================================================
-- INDEX POUR OPTIMISER LES PERFORMANCES
-- =====================================================

-- Index pour les appels
CREATE INDEX IF NOT EXISTS idx_commercial_calls_calleur_id ON commercial_calls(calleur_id);
CREATE INDEX IF NOT EXISTS idx_commercial_calls_call_date ON commercial_calls(call_date);
CREATE INDEX IF NOT EXISTS idx_commercial_calls_call_status ON commercial_calls(call_status);
CREATE INDEX IF NOT EXISTS idx_commercial_calls_lead_source ON commercial_calls(lead_source);

-- Index pour les RDV
CREATE INDEX IF NOT EXISTS idx_commercial_meetings_calleur_id ON commercial_meetings(calleur_id);
CREATE INDEX IF NOT EXISTS idx_commercial_meetings_meeting_date ON commercial_meetings(meeting_date);
CREATE INDEX IF NOT EXISTS idx_commercial_meetings_meeting_status ON commercial_meetings(meeting_status);

-- Index pour les deals
CREATE INDEX IF NOT EXISTS idx_commercial_deals_calleur_id ON commercial_deals(calleur_id);
CREATE INDEX IF NOT EXISTS idx_commercial_deals_deal_status ON commercial_deals(deal_status);
CREATE INDEX IF NOT EXISTS idx_commercial_deals_closing_date ON commercial_deals(closing_date);

-- Index pour les KPIs
CREATE INDEX IF NOT EXISTS idx_commercial_kpis_daily_calleur_id ON commercial_kpis_daily(calleur_id);
CREATE INDEX IF NOT EXISTS idx_commercial_kpis_daily_date ON commercial_kpis_daily(date);

-- Index pour les objectifs
CREATE INDEX IF NOT EXISTS idx_commercial_targets_calleur_id ON commercial_targets(calleur_id);
CREATE INDEX IF NOT EXISTS idx_commercial_targets_period ON commercial_targets(period_start, period_end);

-- Index pour les alertes
CREATE INDEX IF NOT EXISTS idx_commercial_alerts_calleur_id ON commercial_alerts(calleur_id);
CREATE INDEX IF NOT EXISTS idx_commercial_alerts_is_read ON commercial_alerts(is_read);
CREATE INDEX IF NOT EXISTS idx_commercial_alerts_alert_type ON commercial_alerts(alert_type);

-- =====================================================
-- TRIGGERS POUR MISE À JOUR AUTOMATIQUE
-- =====================================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_commercial_users_updated_at BEFORE UPDATE ON commercial_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commercial_calls_updated_at BEFORE UPDATE ON commercial_calls FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commercial_meetings_updated_at BEFORE UPDATE ON commercial_meetings FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commercial_deals_updated_at BEFORE UPDATE ON commercial_deals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commercial_kpis_daily_updated_at BEFORE UPDATE ON commercial_kpis_daily FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commercial_targets_updated_at BEFORE UPDATE ON commercial_targets FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_commercial_points_updated_at BEFORE UPDATE ON commercial_points FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour calculer les KPIs quotidiens
CREATE OR REPLACE FUNCTION calculate_daily_kpis(p_calleur_id UUID, p_date DATE)
RETURNS VOID AS $$
DECLARE
    v_calls_made INTEGER;
    v_calls_answered INTEGER;
    v_calls_duration_total INTEGER;
    v_rdv_scheduled INTEGER;
    v_rdv_completed INTEGER;
    v_rdv_no_show INTEGER;
    v_hot_leads INTEGER;
    v_warm_leads INTEGER;
    v_cold_leads INTEGER;
    v_average_interest_level DECIMAL(3,2);
    v_deals_closed INTEGER;
    v_deals_value DECIMAL(10,2);
    v_deals_lost INTEGER;
    v_conversion_rate DECIMAL(5,2);
BEGIN
    -- Calculer les métriques d'appels
    SELECT 
        COUNT(*),
        COUNT(*) FILTER (WHERE call_status = 'answered'),
        COALESCE(SUM(call_duration), 0)
    INTO v_calls_made, v_calls_answered, v_calls_duration_total
    FROM commercial_calls 
    WHERE calleur_id = p_calleur_id 
    AND DATE(call_date) = p_date;
    
    -- Calculer les métriques de RDV
    SELECT 
        COUNT(*) FILTER (WHERE meeting_status = 'scheduled'),
        COUNT(*) FILTER (WHERE meeting_status = 'completed'),
        COUNT(*) FILTER (WHERE meeting_status = 'no_show')
    INTO v_rdv_scheduled, v_rdv_completed, v_rdv_no_show
    FROM commercial_meetings 
    WHERE calleur_id = p_calleur_id 
    AND DATE(meeting_date) = p_date;
    
    -- Calculer les métriques de qualité
    SELECT 
        COUNT(*) FILTER (WHERE lead_quality = 'hot'),
        COUNT(*) FILTER (WHERE lead_quality = 'warm'),
        COUNT(*) FILTER (WHERE lead_quality = 'cold'),
        COALESCE(AVG(interest_level), 0)
    INTO v_hot_leads, v_warm_leads, v_cold_leads, v_average_interest_level
    FROM commercial_calls 
    WHERE calleur_id = p_calleur_id 
    AND DATE(call_date) = p_date;
    
    -- Calculer les métriques de deals
    SELECT 
        COUNT(*) FILTER (WHERE deal_status = 'closed_won'),
        COALESCE(SUM(deal_value) FILTER (WHERE deal_status = 'closed_won'), 0),
        COUNT(*) FILTER (WHERE deal_status = 'closed_lost')
    INTO v_deals_closed, v_deals_value, v_deals_lost
    FROM commercial_deals 
    WHERE calleur_id = p_calleur_id 
    AND DATE(closing_date) = p_date;
    
    -- Calculer le taux de conversion
    v_conversion_rate := CASE 
        WHEN v_calls_answered > 0 THEN (v_rdv_scheduled::DECIMAL / v_calls_answered) * 100
        ELSE 0
    END;
    
    -- Insérer ou mettre à jour les KPIs
    INSERT INTO commercial_kpis_daily (
        calleur_id, date, calls_made, calls_answered, calls_duration_total,
        rdv_scheduled, rdv_completed, rdv_no_show, conversion_rate,
        hot_leads, warm_leads, cold_leads, average_interest_level,
        deals_closed, deals_value, deals_lost
    ) VALUES (
        p_calleur_id, p_date, v_calls_made, v_calls_answered, v_calls_duration_total,
        v_rdv_scheduled, v_rdv_completed, v_rdv_no_show, v_conversion_rate,
        v_hot_leads, v_warm_leads, v_cold_leads, v_average_interest_level,
        v_deals_closed, v_deals_value, v_deals_lost
    )
    ON CONFLICT (calleur_id, date) 
    DO UPDATE SET
        calls_made = EXCLUDED.calls_made,
        calls_answered = EXCLUDED.calls_answered,
        calls_duration_total = EXCLUDED.calls_duration_total,
        rdv_scheduled = EXCLUDED.rdv_scheduled,
        rdv_completed = EXCLUDED.rdv_completed,
        rdv_no_show = EXCLUDED.rdv_no_show,
        conversion_rate = EXCLUDED.conversion_rate,
        hot_leads = EXCLUDED.hot_leads,
        warm_leads = EXCLUDED.warm_leads,
        cold_leads = EXCLUDED.cold_leads,
        average_interest_level = EXCLUDED.average_interest_level,
        deals_closed = EXCLUDED.deals_closed,
        deals_value = EXCLUDED.deals_value,
        deals_lost = EXCLUDED.deals_lost,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- DONNÉES DE TEST
-- =====================================================

-- Insérer des calleurs de test
INSERT INTO commercial_users (user_id, name, email, role, team) 
SELECT 
    u.id,
    'Antoine Martin',
    'antoine@propulseo.com',
    'calleur',
    'site'
FROM auth.users u 
WHERE u.email = 'antoine@propulseo.com'
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO commercial_users (user_id, name, email, role, team) 
SELECT 
    u.id,
    'Baptiste Dubois',
    'baptiste@propulseo.com',
    'calleur',
    'seo'
FROM auth.users u 
WHERE u.email = 'baptiste@propulseo.com'
ON CONFLICT (user_id) DO NOTHING;

-- Créer des points initiaux pour les calleurs
INSERT INTO commercial_points (calleur_id, points, level)
SELECT id, 0, 1 FROM commercial_users
ON CONFLICT (calleur_id) DO NOTHING;

-- =====================================================
-- POLITIQUES RLS (Row Level Security)
-- =====================================================

-- Activer RLS sur toutes les tables
ALTER TABLE commercial_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_deals ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_kpis_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_alerts ENABLE ROW LEVEL SECURITY;

-- Politiques pour commercial_users
CREATE POLICY "Users can view their own data" ON commercial_users
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own data" ON commercial_users
    FOR UPDATE USING (auth.uid() = user_id);

-- Politiques pour commercial_calls
CREATE POLICY "Users can view their own calls" ON commercial_calls
    FOR SELECT USING (auth.uid() = (SELECT user_id FROM commercial_users WHERE id = calleur_id));

CREATE POLICY "Users can insert their own calls" ON commercial_calls
    FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM commercial_users WHERE id = calleur_id));

CREATE POLICY "Users can update their own calls" ON commercial_calls
    FOR UPDATE USING (auth.uid() = (SELECT user_id FROM commercial_users WHERE id = calleur_id));

-- Politiques pour commercial_meetings
CREATE POLICY "Users can view their own meetings" ON commercial_meetings
    FOR SELECT USING (auth.uid() = (SELECT user_id FROM commercial_users WHERE id = calleur_id));

CREATE POLICY "Users can insert their own meetings" ON commercial_meetings
    FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM commercial_users WHERE id = calleur_id));

CREATE POLICY "Users can update their own meetings" ON commercial_meetings
    FOR UPDATE USING (auth.uid() = (SELECT user_id FROM commercial_users WHERE id = calleur_id));

-- Politiques pour commercial_deals
CREATE POLICY "Users can view their own deals" ON commercial_deals
    FOR SELECT USING (auth.uid() = (SELECT user_id FROM commercial_users WHERE id = calleur_id));

CREATE POLICY "Users can insert their own deals" ON commercial_deals
    FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM commercial_users WHERE id = calleur_id));

CREATE POLICY "Users can update their own deals" ON commercial_deals
    FOR UPDATE USING (auth.uid() = (SELECT user_id FROM commercial_users WHERE id = calleur_id));

-- Politiques pour commercial_kpis_daily
CREATE POLICY "Users can view their own kpis" ON commercial_kpis_daily
    FOR SELECT USING (auth.uid() = (SELECT user_id FROM commercial_users WHERE id = calleur_id));

-- Politiques pour commercial_targets
CREATE POLICY "Users can view their own targets" ON commercial_targets
    FOR SELECT USING (auth.uid() = (SELECT user_id FROM commercial_users WHERE id = calleur_id));

CREATE POLICY "Users can insert their own targets" ON commercial_targets
    FOR INSERT WITH CHECK (auth.uid() = (SELECT user_id FROM commercial_users WHERE id = calleur_id));

CREATE POLICY "Users can update their own targets" ON commercial_targets
    FOR UPDATE USING (auth.uid() = (SELECT user_id FROM commercial_users WHERE id = calleur_id));

-- Politiques pour commercial_points
CREATE POLICY "Users can view their own points" ON commercial_points
    FOR SELECT USING (auth.uid() = (SELECT user_id FROM commercial_users WHERE id = calleur_id));

-- Politiques pour commercial_alerts
CREATE POLICY "Users can view their own alerts" ON commercial_alerts
    FOR SELECT USING (auth.uid() = (SELECT user_id FROM commercial_users WHERE id = calleur_id));

CREATE POLICY "Users can update their own alerts" ON commercial_alerts
    FOR UPDATE USING (auth.uid() = (SELECT user_id FROM commercial_users WHERE id = calleur_id));

-- =====================================================
-- VUES POUR LE DASHBOARD
-- =====================================================

-- Vue des KPIs par calleur (derniers 30 jours)
CREATE OR REPLACE VIEW commercial_kpis_summary AS
SELECT 
    cu.id as calleur_id,
    cu.name as calleur_name,
    cu.team,
    COALESCE(SUM(kd.calls_made), 0) as total_calls_30d,
    COALESCE(SUM(kd.calls_answered), 0) as total_calls_answered_30d,
    COALESCE(SUM(kd.rdv_scheduled), 0) as total_rdv_scheduled_30d,
    COALESCE(SUM(kd.rdv_completed), 0) as total_rdv_completed_30d,
    COALESCE(SUM(kd.deals_closed), 0) as total_deals_closed_30d,
    COALESCE(SUM(kd.deals_value), 0) as total_revenue_30d,
    COALESCE(AVG(kd.conversion_rate), 0) as avg_conversion_rate_30d,
    COALESCE(AVG(kd.average_interest_level), 0) as avg_interest_level_30d
FROM commercial_users cu
LEFT JOIN commercial_kpis_daily kd ON cu.id = kd.calleur_id 
    AND kd.date >= CURRENT_DATE - INTERVAL '30 days'
WHERE cu.is_active = TRUE
GROUP BY cu.id, cu.name, cu.team;

-- Vue des objectifs vs réalisé
CREATE OR REPLACE VIEW commercial_targets_vs_actual AS
SELECT 
    cu.id as calleur_id,
    cu.name as calleur_name,
    ct.period_type,
    ct.period_start,
    ct.period_end,
    ct.target_calls,
    ct.target_rdv,
    ct.target_deals,
    ct.target_revenue,
    COALESCE(SUM(kd.calls_made), 0) as actual_calls,
    COALESCE(SUM(kd.rdv_scheduled), 0) as actual_rdv,
    COALESCE(SUM(kd.deals_closed), 0) as actual_deals,
    COALESCE(SUM(kd.deals_value), 0) as actual_revenue
FROM commercial_users cu
JOIN commercial_targets ct ON cu.id = ct.calleur_id
LEFT JOIN commercial_kpis_daily kd ON cu.id = kd.calleur_id 
    AND kd.date >= ct.period_start 
    AND kd.date <= ct.period_end
WHERE ct.is_active = TRUE
GROUP BY cu.id, cu.name, ct.period_type, ct.period_start, ct.period_end, 
         ct.target_calls, ct.target_rdv, ct.target_deals, ct.target_revenue;

-- =====================================================
-- FIN DU SCRIPT
-- =====================================================

-- Vérification des tables créées
SELECT 
    'Tables créées avec succès' as status,
    COUNT(*) as table_count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'commercial_%';

-- Afficher la structure des tables principales
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('commercial_users', 'commercial_calls', 'commercial_meetings', 'commercial_deals')
ORDER BY table_name, ordinal_position;
