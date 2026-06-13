-- =====================================================
-- FONCTIONS SQL POUR LE SUIVI COMMERCIAL
-- =====================================================

-- Fonction pour récupérer les KPIs commerciaux
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
    CASE 
      WHEN date_from >= NOW() - INTERVAL '7 days' THEN '7d'
      WHEN date_from >= NOW() - INTERVAL '30 days' THEN '30d'
      ELSE '90d'
    END as period,
    COALESCE(call_stats.calls_count, 0) as calls_count,
    cu.target_calls_per_day * CASE 
      WHEN date_from >= NOW() - INTERVAL '7 days' THEN 7
      WHEN date_from >= NOW() - INTERVAL '30 days' THEN 30
      ELSE 90
    END as calls_target,
    CASE 
      WHEN cu.target_calls_per_day > 0 THEN 
        ROUND((COALESCE(call_stats.calls_count, 0)::NUMERIC / (cu.target_calls_per_day * CASE 
          WHEN date_from >= NOW() - INTERVAL '7 days' THEN 7
          WHEN date_from >= NOW() - INTERVAL '30 days' THEN 30
          ELSE 90
        END)) * 100, 1)
      ELSE 0
    END as calls_percentage,
    COALESCE(meeting_stats.rdv_count, 0) as rdv_count,
    cu.target_rdv_per_week * CASE 
      WHEN date_from >= NOW() - INTERVAL '7 days' THEN 1
      WHEN date_from >= NOW() - INTERVAL '30 days' THEN 4
      ELSE 12
    END as rdv_target,
    CASE 
      WHEN cu.target_rdv_per_week > 0 THEN 
        ROUND((COALESCE(meeting_stats.rdv_count, 0)::NUMERIC / (cu.target_rdv_per_week * CASE 
          WHEN date_from >= NOW() - INTERVAL '7 days' THEN 1
          WHEN date_from >= NOW() - INTERVAL '30 days' THEN 4
          ELSE 12
        END)) * 100, 1)
      ELSE 0
    END as rdv_percentage,
    COALESCE(deal_stats.deals_count, 0) as deals_count,
    cu.target_deals_per_month * CASE 
      WHEN date_from >= NOW() - INTERVAL '7 days' THEN 0.25
      WHEN date_from >= NOW() - INTERVAL '30 days' THEN 1
      ELSE 3
    END as deals_target,
    CASE 
      WHEN cu.target_deals_per_month > 0 THEN 
        ROUND((COALESCE(deal_stats.deals_count, 0)::NUMERIC / (cu.target_deals_per_month * CASE 
          WHEN date_from >= NOW() - INTERVAL '7 days' THEN 0.25
          WHEN date_from >= NOW() - INTERVAL '30 days' THEN 1
          ELSE 3
        END)) * 100, 1)
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

-- Fonction pour récupérer les statistiques individuelles
CREATE OR REPLACE FUNCTION get_commercial_stats(calleur_id UUID)
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
    CASE 
      WHEN COALESCE(deal_stats.total_deals, 0) > 0 THEN 
        ROUND(AVG(EXTRACT(EPOCH FROM (d.actual_close_date::timestamp - d.deal_date::timestamp)) / 86400), 0)
      ELSE 0
    END as average_sales_cycle,
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
  LEFT JOIN commercial_deals d ON cu.id = d.calleur_id AND d.deal_status = 'closed_won' AND d.actual_close_date IS NOT NULL
  LEFT JOIN commercial_points points ON cu.id = points.calleur_id
  LEFT JOIN (
    SELECT 
      calleur_id,
      COUNT(*) as badges_count
    FROM commercial_user_badges
    GROUP BY calleur_id
  ) badge_stats ON cu.id = badge_stats.calleur_id
  WHERE cu.id = calleur_id
  GROUP BY cu.id, call_stats.total_calls, meeting_stats.total_rdv, meeting_stats.completed_rdv, 
           deal_stats.total_deals, deal_stats.total_deals_value, points.points_total, points.level, badge_stats.badges_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour récupérer le classement
CREATE OR REPLACE FUNCTION get_commercial_leaderboard(date_from TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days')
RETURNS TABLE (
  calleur_id UUID,
  calleur_name TEXT,
  rank BIGINT,
  points INTEGER,
  level INTEGER,
  calls_count BIGINT,
  rdv_count BIGINT,
  deals_count BIGINT,
  deals_value NUMERIC,
  badges_count BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    cu.id as calleur_id,
    cu.name as calleur_name,
    ROW_NUMBER() OVER (ORDER BY COALESCE(points.points_total, 0) DESC, COALESCE(call_stats.calls_count, 0) DESC) as rank,
    COALESCE(points.points_total, 0) as points,
    COALESCE(points.level, 1) as level,
    COALESCE(call_stats.calls_count, 0) as calls_count,
    COALESCE(meeting_stats.rdv_count, 0) as rdv_count,
    COALESCE(deal_stats.deals_count, 0) as deals_count,
    COALESCE(deal_stats.deals_value, 0) as deals_value,
    COALESCE(badge_stats.badges_count, 0) as badges_count
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
      COUNT(*) as rdv_count
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
  LEFT JOIN (
    SELECT 
      calleur_id,
      COUNT(*) as badges_count
    FROM commercial_user_badges
    GROUP BY calleur_id
  ) badge_stats ON cu.id = badge_stats.calleur_id
  WHERE cu.is_active = true
  ORDER BY points DESC, calls_count DESC;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour récupérer les données de graphique
CREATE OR REPLACE FUNCTION get_commercial_chart_data(date_from TIMESTAMP WITH TIME ZONE DEFAULT NOW() - INTERVAL '30 days')
RETURNS TABLE (
  date DATE,
  calls BIGINT,
  rdv BIGINT,
  deals BIGINT,
  deals_value NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    date_series.date,
    COALESCE(call_stats.calls, 0) as calls,
    COALESCE(meeting_stats.rdv, 0) as rdv,
    COALESCE(deal_stats.deals, 0) as deals,
    COALESCE(deal_stats.deals_value, 0) as deals_value
  FROM (
    SELECT generate_series(
      date_from::date,
      NOW()::date,
      '1 day'::interval
    )::date as date
  ) date_series
  LEFT JOIN (
    SELECT 
      call_date::date as date,
      COUNT(*) as calls
    FROM commercial_calls
    WHERE call_date >= date_from
    GROUP BY call_date::date
  ) call_stats ON date_series.date = call_stats.date
  LEFT JOIN (
    SELECT 
      meeting_date::date as date,
      COUNT(*) as rdv
    FROM commercial_meetings
    WHERE meeting_date >= date_from
    GROUP BY meeting_date::date
  ) meeting_stats ON date_series.date = meeting_stats.date
  LEFT JOIN (
    SELECT 
      deal_date::date as date,
      COUNT(*) FILTER (WHERE deal_status = 'closed_won') as deals,
      SUM(deal_value) FILTER (WHERE deal_status = 'closed_won') as deals_value
    FROM commercial_deals
    WHERE deal_date >= date_from
    GROUP BY deal_date::date
  ) deal_stats ON date_series.date = deal_stats.date
  ORDER BY date_series.date;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer automatiquement des alertes
CREATE OR REPLACE FUNCTION create_commercial_alerts()
RETURNS void AS $$
DECLARE
  calleur_record RECORD;
  today_calls INTEGER;
  week_rdv INTEGER;
  month_deals INTEGER;
  alert_exists BOOLEAN;
BEGIN
  -- Parcourir tous les calleurs actifs
  FOR calleur_record IN 
    SELECT id, name, target_calls_per_day, target_rdv_per_week, target_deals_per_month
    FROM commercial_users 
    WHERE is_active = true
  LOOP
    -- Vérifier les appels du jour
    SELECT COUNT(*) INTO today_calls
    FROM commercial_calls
    WHERE calleur_id = calleur_record.id
    AND call_date::date = CURRENT_DATE;
    
    IF today_calls < calleur_record.target_calls_per_day THEN
      -- Vérifier si l'alerte existe déjà
      SELECT EXISTS(
        SELECT 1 FROM commercial_alerts
        WHERE calleur_id = calleur_record.id
        AND alert_type = 'target_missed'
        AND alert_level = 'warning'
        AND created_at::date = CURRENT_DATE
      ) INTO alert_exists;
      
      IF NOT alert_exists THEN
        INSERT INTO commercial_alerts (
          calleur_id,
          alert_type,
          alert_level,
          title,
          message
        ) VALUES (
          calleur_record.id,
          'target_missed',
          'warning',
          'Objectif d''appels non atteint',
          'Vous avez effectué ' || today_calls || ' appels aujourd''hui, objectif: ' || calleur_record.target_calls_per_day
        );
      END IF;
    END IF;
    
    -- Vérifier les RDV de la semaine
    SELECT COUNT(*) INTO week_rdv
    FROM commercial_meetings
    WHERE calleur_id = calleur_record.id
    AND meeting_date >= date_trunc('week', CURRENT_DATE)
    AND meeting_date < date_trunc('week', CURRENT_DATE) + INTERVAL '1 week';
    
    IF week_rdv < calleur_record.target_rdv_per_week THEN
      SELECT EXISTS(
        SELECT 1 FROM commercial_alerts
        WHERE calleur_id = calleur_record.id
        AND alert_type = 'target_missed'
        AND alert_level = 'info'
        AND created_at >= date_trunc('week', CURRENT_DATE)
      ) INTO alert_exists;
      
      IF NOT alert_exists THEN
        INSERT INTO commercial_alerts (
          calleur_id,
          alert_type,
          alert_level,
          title,
          message
        ) VALUES (
          calleur_record.id,
          'target_missed',
          'info',
          'Objectif RDV de la semaine',
          'Vous avez planifié ' || week_rdv || ' RDV cette semaine, objectif: ' || calleur_record.target_rdv_per_week
        );
      END IF;
    END IF;
    
    -- Vérifier les deals du mois
    SELECT COUNT(*) INTO month_deals
    FROM commercial_deals
    WHERE calleur_id = calleur_record.id
    AND deal_status = 'closed_won'
    AND deal_date >= date_trunc('month', CURRENT_DATE);
    
    IF month_deals < calleur_record.target_deals_per_month THEN
      SELECT EXISTS(
        SELECT 1 FROM commercial_alerts
        WHERE calleur_id = calleur_record.id
        AND alert_type = 'target_missed'
        AND alert_level = 'critical'
        AND created_at >= date_trunc('month', CURRENT_DATE)
      ) INTO alert_exists;
      
      IF NOT alert_exists THEN
        INSERT INTO commercial_alerts (
          calleur_id,
          alert_type,
          alert_level,
          title,
          message
        ) VALUES (
          calleur_record.id,
          'target_missed',
          'critical',
          'Objectif deals du mois',
          'Vous avez fermé ' || month_deals || ' deals ce mois, objectif: ' || calleur_record.target_deals_per_month
        );
      END IF;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour attribuer automatiquement les badges
CREATE OR REPLACE FUNCTION assign_commercial_badges()
RETURNS void AS $$
DECLARE
  calleur_record RECORD;
  badge_record RECORD;
  criteria_met BOOLEAN;
  badge_exists BOOLEAN;
  calls_count INTEGER;
  rdv_count INTEGER;
  deals_count INTEGER;
  points_total INTEGER;
BEGIN
  -- Parcourir tous les calleurs actifs
  FOR calleur_record IN 
    SELECT id, name FROM commercial_users WHERE is_active = true
  LOOP
    -- Récupérer les statistiques du calleur
    SELECT 
      COALESCE(COUNT(*), 0),
      COALESCE((SELECT COUNT(*) FROM commercial_meetings WHERE calleur_id = calleur_record.id), 0),
      COALESCE((SELECT COUNT(*) FROM commercial_deals WHERE calleur_id = calleur_record.id AND deal_status = 'closed_won'), 0),
      COALESCE((SELECT points_total FROM commercial_points WHERE calleur_id = calleur_record.id), 0)
    INTO calls_count, rdv_count, deals_count, points_total
    FROM commercial_calls
    WHERE calleur_id = calleur_record.id;
    
    -- Parcourir tous les badges actifs
    FOR badge_record IN 
      SELECT * FROM commercial_badges WHERE is_active = true
    LOOP
      -- Vérifier si le badge existe déjà
      SELECT EXISTS(
        SELECT 1 FROM commercial_user_badges
        WHERE calleur_id = calleur_record.id
        AND badge_id = badge_record.id
      ) INTO badge_exists;
      
      IF NOT badge_exists THEN
        -- Vérifier les critères selon le type
        criteria_met := false;
        
        CASE badge_record.criteria_type
          WHEN 'calls' THEN
            criteria_met := calls_count >= badge_record.criteria_value;
          WHEN 'rdv' THEN
            criteria_met := rdv_count >= badge_record.criteria_value;
          WHEN 'deals' THEN
            criteria_met := deals_count >= badge_record.criteria_value;
          WHEN 'special' THEN
            criteria_met := points_total >= badge_record.points_required;
        END CASE;
        
        -- Attribuer le badge si les critères sont remplis
        IF criteria_met THEN
          INSERT INTO commercial_user_badges (calleur_id, badge_id)
          VALUES (calleur_record.id, badge_record.id);
        END IF;
      END IF;
    END LOOP;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- TRIGGERS POUR LES ALERTES ET BADGES AUTOMATIQUES
-- =====================================================

-- Trigger pour créer des alertes après insertion d'un appel
CREATE OR REPLACE FUNCTION trigger_create_call_alerts()
RETURNS TRIGGER AS $$
BEGIN
  -- Créer des alertes si nécessaire
  PERFORM create_commercial_alerts();
  
  -- Attribuer des badges si nécessaire
  PERFORM assign_commercial_badges();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calls_alerts
  AFTER INSERT ON commercial_calls
  FOR EACH ROW EXECUTE FUNCTION trigger_create_call_alerts();

-- Trigger pour créer des alertes après insertion d'un RDV
CREATE TRIGGER trigger_meetings_alerts
  AFTER INSERT ON commercial_meetings
  FOR EACH ROW EXECUTE FUNCTION trigger_create_call_alerts();

-- Trigger pour créer des alertes après insertion d'un deal
CREATE TRIGGER trigger_deals_alerts
  AFTER INSERT ON commercial_deals
  FOR EACH ROW EXECUTE FUNCTION trigger_create_call_alerts();

-- =====================================================
-- TÂCHE CRON POUR LES ALERTES QUOTIDIENNES
-- =====================================================

-- Créer une extension pour les tâches cron si elle n'existe pas
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Programmer la création d'alertes tous les jours à 18h
SELECT cron.schedule('daily-commercial-alerts', '0 18 * * *', 'SELECT create_commercial_alerts();');

-- Programmer l'attribution de badges tous les jours à 19h
SELECT cron.schedule('daily-commercial-badges', '0 19 * * *', 'SELECT assign_commercial_badges();');
