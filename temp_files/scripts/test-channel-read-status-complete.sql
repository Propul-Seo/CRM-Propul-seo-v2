-- Script de test complet pour le système de comptage des messages non lus
-- Exécuter après avoir appliqué la migration

-- ========================================
-- 1. VÉRIFICATION DE LA STRUCTURE
-- ========================================

-- Vérifier la table channel_read_status
SELECT 'Table channel_read_status' as test, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'channel_read_status') 
            THEN '✅ CRÉÉE' ELSE '❌ MANQUANTE' END as result;

-- Vérifier les colonnes
SELECT 'Colonnes de channel_read_status' as test, 
       COUNT(*) as nombre_colonnes
FROM information_schema.columns 
WHERE table_name = 'channel_read_status';

-- ========================================
-- 2. VÉRIFICATION DES FONCTIONS
-- ========================================

-- Vérifier les fonctions SQL
SELECT 'Fonction get_channel_unread_count' as test,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'get_channel_unread_count')
            THEN '✅ CRÉÉE' ELSE '❌ MANQUANTE' END as result;

SELECT 'Fonction mark_channel_as_read' as test,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.routines WHERE routine_name = 'mark_channel_as_read')
            THEN '✅ CRÉÉE' ELSE '❌ MANQUANTE' END as result;

-- ========================================
-- 3. VÉRIFICATION DES POLITIQUES RLS
-- ========================================

-- Vérifier que RLS est activé
SELECT 'RLS activé sur channel_read_status' as test,
       CASE WHEN EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'channel_read_status' AND rowsecurity = true)
            THEN '✅ ACTIVÉ' ELSE '❌ DÉSACTIVÉ' END as result;

-- Vérifier les politiques
SELECT 'Politiques RLS' as test, COUNT(*) as nombre_politiques
FROM pg_policies 
WHERE tablename = 'channel_read_status';

-- ========================================
-- 4. VÉRIFICATION DES INDEX
-- ========================================

-- Vérifier les index
SELECT 'Index sur channel_read_status' as test, COUNT(*) as nombre_index
FROM pg_indexes 
WHERE tablename = 'channel_read_status';

-- ========================================
-- 5. VÉRIFICATION DU TRIGGER
-- ========================================

-- Vérifier le trigger
SELECT 'Trigger de mise à jour' as test,
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.triggers WHERE trigger_name = 'trigger_update_channel_read_status_updated_at')
            THEN '✅ CRÉÉ' ELSE '❌ MANQUANT' END as result;

-- ========================================
-- 6. TEST DES FONCTIONS (si données existent)
-- ========================================

-- Vérifier s'il y a des canaux et utilisateurs pour tester
SELECT 'Canaux disponibles' as test, COUNT(*) as nombre
FROM channels;

SELECT 'Utilisateurs disponibles' as test, COUNT(*) as nombre
FROM user_profiles;

-- ========================================
-- 7. RÉSUMÉ DES VÉRIFICATIONS
-- ========================================

SELECT 
    'RÉSUMÉ DE LA MIGRATION' as section,
    'Vérifiez que tous les éléments ci-dessus sont ✅ CRÉÉS' as instruction;

-- ========================================
-- 8. INSTRUCTIONS DE TEST MANUEL
-- ========================================

SELECT 'TEST MANUEL REQUIS' as section,
       '1. Créer un canal de test' as etape_1,
       '2. Envoyer des messages' as etape_2,
       '3. Vérifier le compteur non lus' as etape_3,
       '4. Sélectionner le canal' as etape_4,
       '5. Vérifier que le compteur disparaît' as etape_5;
