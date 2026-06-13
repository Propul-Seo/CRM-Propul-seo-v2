-- Test rapide des fonctions SQL pour le système de comptage
-- À exécuter après avoir vérifié que la migration est en place

-- ========================================
-- TEST 1: Vérifier que les fonctions sont appelables
-- ========================================

-- Test de la fonction get_channel_unread_count (avec des paramètres factices)
-- Cette fonction devrait retourner 0 si les paramètres n'existent pas
SELECT 'Test get_channel_unread_count' as test,
       CASE 
           WHEN get_channel_unread_count('00000000-0000-0000-0000-000000000000', '00000000-0000-0000-0000-000000000000') = 0
           THEN '✅ FONCTIONNE (retourne 0 pour IDs inexistants)'
           ELSE '❌ ERREUR'
       END as result;

-- ========================================
-- TEST 2: Vérifier la structure des fonctions
-- ========================================

-- Vérifier les paramètres des fonctions
SELECT 
    p.proname as fonction,
    pg_get_function_arguments(p.oid) as parametres,
    pg_get_function_result(p.oid) as type_retour
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN ('get_channel_unread_count', 'mark_channel_as_read')
ORDER BY p.proname;

-- ========================================
-- TEST 3: Vérifier les permissions des fonctions
-- ========================================

SELECT 
    p.proname as fonction,
    CASE 
        WHEN p.prosecdef THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER'
    END as securite
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' 
AND p.proname IN ('get_channel_unread_count', 'mark_channel_as_read')
ORDER BY p.proname;

-- ========================================
-- TEST 4: Vérifier que la table est accessible
-- ========================================

-- Vérifier que la table channel_read_status est accessible
SELECT 'Accès à channel_read_status' as test,
       CASE 
           WHEN (SELECT COUNT(*) FROM channel_read_status) >= 0
           THEN '✅ ACCÈS OK'
           ELSE '❌ ERREUR D ACCÈS'
       END as result;

-- ========================================
-- RÉSUMÉ
-- ========================================

SELECT 'TESTS TERMINÉS' as status,
       'Si tous les tests sont ✅, la migration est fonctionnelle' as message;
