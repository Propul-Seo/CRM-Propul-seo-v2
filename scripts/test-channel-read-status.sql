-- Script de test pour vérifier le système de comptage des messages non lus
-- À exécuter après avoir appliqué la migration

-- 1. Vérifier que la table channel_read_status a été créée
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'channel_read_status'
ORDER BY ordinal_position;

-- 2. Vérifier que les fonctions ont été créées
SELECT 
    routine_name,
    routine_type,
    data_type
FROM information_schema.routines 
WHERE routine_name IN ('get_channel_unread_count', 'mark_channel_as_read')
ORDER BY routine_name;

-- 3. Vérifier que les politiques RLS sont en place
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'channel_read_status';

-- 4. Tester la fonction de comptage des messages non lus
-- Remplacez 'USER_ID_TEST' et 'CHANNEL_ID_TEST' par des valeurs réelles
-- SELECT get_channel_unread_count('CHANNEL_ID_TEST', 'USER_ID_TEST');

-- 5. Vérifier la structure des index
SELECT 
    indexname,
    indexdef
FROM pg_indexes 
WHERE tablename = 'channel_read_status';

-- 6. Vérifier que le trigger est en place
SELECT 
    trigger_name,
    event_manipulation,
    event_object_table,
    action_statement
FROM information_schema.triggers 
WHERE event_object_table = 'channel_read_status';
