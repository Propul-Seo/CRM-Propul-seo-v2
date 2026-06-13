-- =====================================================
-- TEST DU DASHBOARD COMMERCIAL
-- =====================================================
-- Script de test pour vérifier que le dashboard commercial fonctionne

-- 1. Vérifier que les tables commerciales existent
SELECT 
    'Tables commerciales créées' as test,
    COUNT(*) as count
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'commercial_%';

-- 2. Vérifier la structure des tables principales
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name IN ('commercial_users', 'commercial_calls', 'commercial_meetings', 'commercial_deals')
ORDER BY table_name, ordinal_position;

-- 3. Vérifier les vues créées
SELECT 
    'Vues commerciales créées' as test,
    COUNT(*) as count
FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name LIKE 'commercial_%';

-- 4. Vérifier les fonctions créées
SELECT 
    'Fonctions commerciales créées' as test,
    COUNT(*) as count
FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name LIKE '%commercial%';

-- 5. Tester l'insertion d'un calleur de test
INSERT INTO commercial_users (user_id, name, email, role, team)
SELECT 
    u.id,
    'Test Commercial',
    'test@commercial.com',
    'calleur',
    'site'
FROM auth.users u 
WHERE u.email = 'test@commercial.com'
ON CONFLICT (user_id) DO NOTHING;

-- 6. Vérifier que le calleur a été créé
SELECT 
    'Calleur de test créé' as test,
    COUNT(*) as count
FROM commercial_users 
WHERE email = 'test@commercial.com';

-- 7. Tester l'insertion d'un appel de test
WITH test_calleur AS (
    SELECT id FROM commercial_users WHERE email = 'test@commercial.com' LIMIT 1
)
INSERT INTO commercial_calls (
    calleur_id, 
    lead_name, 
    lead_source, 
    call_date, 
    call_status, 
    call_outcome,
    lead_quality,
    interest_level
)
SELECT 
    tc.id,
    'Lead Test',
    'bot_one',
    NOW(),
    'answered',
    'rdv_scheduled',
    'hot',
    4
FROM test_calleur tc;

-- 8. Vérifier que l'appel a été créé
SELECT 
    'Appel de test créé' as test,
    COUNT(*) as count
FROM commercial_calls 
WHERE lead_name = 'Lead Test';

-- 9. Tester le calcul des KPIs quotidiens
WITH test_calleur AS (
    SELECT id FROM commercial_users WHERE email = 'test@commercial.com' LIMIT 1
)
SELECT calculate_daily_kpis(tc.id, CURRENT_DATE)
FROM test_calleur tc;

-- 10. Vérifier que les KPIs ont été calculés
SELECT 
    'KPIs quotidiens calculés' as test,
    COUNT(*) as count
FROM commercial_kpis_daily 
WHERE date = CURRENT_DATE;

-- 11. Tester la vue des KPIs summary
SELECT 
    'Vue KPIs summary fonctionne' as test,
    COUNT(*) as count
FROM commercial_kpis_summary;

-- 12. Afficher un résumé des tests
SELECT 
    'RÉSUMÉ DES TESTS' as info,
    'Dashboard commercial prêt à utiliser' as status;
