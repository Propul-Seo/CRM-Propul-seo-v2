-- =====================================================
-- TEST FINAL DU MODULE COMMERCIAL
-- =====================================================

-- 1. Vérifier que les tables existent
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'commercial_%'
ORDER BY table_name;

-- 2. Vérifier que les fonctions existent
SELECT routine_name 
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE 'get_commercial_%'
ORDER BY routine_name;

-- 3. Vérifier que RLS est désactivé
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename LIKE 'commercial_%'
ORDER BY tablename;

-- 4. Tester la fonction get_commercial_stats
SELECT * FROM get_commercial_stats('470c709c-abce-48c8-b8b3-320cd98a5ed5'::UUID);

-- 5. Tester la fonction get_commercial_kpis
SELECT * FROM get_commercial_kpis();

-- 6. Tester la fonction get_commercial_leaderboard
SELECT * FROM get_commercial_leaderboard();

-- 7. Tester la fonction get_commercial_chart_data
SELECT * FROM get_commercial_chart_data();

-- 8. Vérifier les données de test
SELECT COUNT(*) as total_users FROM commercial_users;
SELECT COUNT(*) as total_calls FROM commercial_calls;
SELECT COUNT(*) as total_meetings FROM commercial_meetings;
SELECT COUNT(*) as total_deals FROM commercial_deals;
SELECT COUNT(*) as total_points FROM commercial_points;
SELECT COUNT(*) as total_badges FROM commercial_badges;
SELECT COUNT(*) as total_user_badges FROM commercial_user_badges;
SELECT COUNT(*) as total_alerts FROM commercial_alerts;
