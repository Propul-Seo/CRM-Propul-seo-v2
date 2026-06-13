-- =====================================================
-- NETTOYAGE DES TABLES COMMERCIALES INUTILES
-- =====================================================
-- Script pour supprimer les tables commerciales qui complexifient le système
-- et ne sont plus nécessaires

-- 1. Supprimer les contraintes de clés étrangères d'abord (si les tables existent)
DO $$ 
BEGIN
    -- Supprimer les contraintes seulement si les tables existent
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'commercial_points') THEN
        ALTER TABLE commercial_points DROP CONSTRAINT IF EXISTS commercial_points_calleur_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'commercial_meetings') THEN
        ALTER TABLE commercial_meetings DROP CONSTRAINT IF EXISTS commercial_meetings_calleur_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'commercial_calls') THEN
        ALTER TABLE commercial_calls DROP CONSTRAINT IF EXISTS commercial_calls_calleur_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'commercial_deals') THEN
        ALTER TABLE commercial_deals DROP CONSTRAINT IF EXISTS commercial_deals_calleur_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'commercial_badges') THEN
        ALTER TABLE commercial_badges DROP CONSTRAINT IF EXISTS commercial_badges_calleur_id_fkey;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'commercial_user_badges') THEN
        ALTER TABLE commercial_user_badges DROP CONSTRAINT IF EXISTS commercial_user_badges_calleur_id_fkey;
    END IF;
END $$;

-- 2. Supprimer les tables commerciales
DROP TABLE IF EXISTS commercial_user_badges CASCADE;
DROP TABLE IF EXISTS commercial_badges CASCADE;
DROP TABLE IF EXISTS commercial_points CASCADE;
DROP TABLE IF EXISTS commercial_deals CASCADE;
DROP TABLE IF EXISTS commercial_meetings CASCADE;
DROP TABLE IF EXISTS commercial_calls CASCADE;
DROP TABLE IF EXISTS commercial_alerts CASCADE;
DROP TABLE IF EXISTS commercial_users CASCADE;

-- 3. Supprimer les fonctions RPC liées aux tables commerciales
DROP FUNCTION IF EXISTS get_commercial_stats(UUID);
DROP FUNCTION IF EXISTS get_commercial_leaderboard(TEXT, TIMESTAMPTZ, TIMESTAMPTZ);

-- 4. Vérifier que les tables ont été supprimées
SELECT 'Tables commerciales supprimées avec succès' as status;

-- 5. Afficher les tables restantes
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE '%commercial%';

-- Si aucune table commerciale n'est affichée, c'est que le nettoyage a réussi !
