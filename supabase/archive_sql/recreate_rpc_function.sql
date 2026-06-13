-- =====================================================
-- RECRÉER LA FONCTION RPC MANQUANTE
-- =====================================================

-- 1. SUPPRIMER L'ANCIENNE FONCTION
DROP FUNCTION IF EXISTS get_commercial_stats(UUID);

-- 2. CRÉER LA NOUVELLE FONCTION
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

-- 3. DONNER LES PERMISSIONS
GRANT EXECUTE ON FUNCTION get_commercial_stats(UUID) TO anon;
GRANT EXECUTE ON FUNCTION get_commercial_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_commercial_stats(UUID) TO service_role;

-- 4. TESTER LA FONCTION
SELECT 'Test fonction RPC:' as info;
SELECT * FROM get_commercial_stats('470c709c-abce-48c8-b8b3-320cd98a5ed5'::UUID);

-- 5. VÉRIFIER QUE LA FONCTION EXISTE
SELECT routine_name, routine_type 
FROM information_schema.routines 
WHERE routine_name = 'get_commercial_stats';
