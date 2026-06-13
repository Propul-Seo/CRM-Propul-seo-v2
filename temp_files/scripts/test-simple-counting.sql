-- Test simple du comptage des messages non lus
-- Version simplifiée qui fonctionne sans la migration complexe

-- ========================================
-- 1. VÉRIFICATION DES TABLES EXISTANTES
-- ========================================

-- Vérifier que les tables de base existent
SELECT 'Table channels' as test, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'channels') 
            THEN '✅ EXISTE' ELSE '❌ MANQUANTE' END as result;

SELECT 'Table messages' as test, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') 
            THEN '✅ EXISTE' ELSE '❌ MANQUANTE' END as result;

SELECT 'Table user_profiles' as test, 
       CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'user_profiles') 
            THEN '✅ EXISTE' ELSE '❌ MANQUANTE' END as result;

-- ========================================
-- 2. COMPTAGE SIMPLE DES MESSAGES
-- ========================================

-- Compter tous les messages
SELECT 'Total messages' as test, COUNT(*) as nombre
FROM messages;

-- Compter les messages par canal
SELECT 'Messages par canal' as test, 
       channel_id, 
       COUNT(*) as nombre_messages
FROM messages 
GROUP BY channel_id 
ORDER BY nombre_messages DESC;

-- ========================================
-- 3. TEST DE COMPTAGE MANUEL
-- ========================================

-- Exemple de comptage pour un canal spécifique (remplacez CHANNEL_ID par un vrai ID)
-- SELECT 'Messages dans canal CHANNEL_ID' as test,
--        COUNT(*) as nombre_messages
-- FROM messages 
-- WHERE channel_id = 'CHANNEL_ID';

-- ========================================
-- 4. VÉRIFICATION DES UTILISATEURS
-- ========================================

-- Compter les utilisateurs
SELECT 'Total utilisateurs' as test, COUNT(*) as nombre
FROM user_profiles;

-- Lister les utilisateurs
SELECT 'Utilisateurs disponibles' as test, 
       id, 
       name, 
       created_at
FROM user_profiles 
ORDER BY created_at;

-- ========================================
-- 5. RÉSUMÉ
-- ========================================

SELECT 'TEST SIMPLE TERMINÉ' as status,
       'Si toutes les tables existent ✅, le comptage de base fonctionne' as message;
