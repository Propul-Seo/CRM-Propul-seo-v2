-- =====================================================
-- DÉSACTIVATION COMPLÈTE DE RLS
-- =====================================================

-- 1. DÉSACTIVER RLS POUR TOUTES LES TABLES COMMERCIALES
ALTER TABLE commercial_users DISABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_calls DISABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_meetings DISABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_deals DISABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_points DISABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_user_badges DISABLE ROW LEVEL SECURITY;
ALTER TABLE commercial_alerts DISABLE ROW LEVEL SECURITY;

-- 2. SUPPRIMER TOUTES LES POLITIQUES RLS EXISTANTES
DROP POLICY IF EXISTS "Enable read access for all users" ON commercial_users;
DROP POLICY IF EXISTS "Enable insert for all users" ON commercial_users;
DROP POLICY IF EXISTS "Enable update for all users" ON commercial_users;
DROP POLICY IF EXISTS "Enable delete for all users" ON commercial_users;

DROP POLICY IF EXISTS "Enable read access for all users" ON commercial_calls;
DROP POLICY IF EXISTS "Enable insert for all users" ON commercial_calls;
DROP POLICY IF EXISTS "Enable update for all users" ON commercial_calls;
DROP POLICY IF EXISTS "Enable delete for all users" ON commercial_calls;

DROP POLICY IF EXISTS "Enable read access for all users" ON commercial_meetings;
DROP POLICY IF EXISTS "Enable insert for all users" ON commercial_meetings;
DROP POLICY IF EXISTS "Enable update for all users" ON commercial_meetings;
DROP POLICY IF EXISTS "Enable delete for all users" ON commercial_meetings;

DROP POLICY IF EXISTS "Enable read access for all users" ON commercial_deals;
DROP POLICY IF EXISTS "Enable insert for all users" ON commercial_deals;
DROP POLICY IF EXISTS "Enable update for all users" ON commercial_deals;
DROP POLICY IF EXISTS "Enable delete for all users" ON commercial_deals;

DROP POLICY IF EXISTS "Enable read access for all users" ON commercial_points;
DROP POLICY IF EXISTS "Enable insert for all users" ON commercial_points;
DROP POLICY IF EXISTS "Enable update for all users" ON commercial_points;
DROP POLICY IF EXISTS "Enable delete for all users" ON commercial_points;

DROP POLICY IF EXISTS "Enable read access for all users" ON commercial_badges;
DROP POLICY IF EXISTS "Enable insert for all users" ON commercial_badges;
DROP POLICY IF EXISTS "Enable update for all users" ON commercial_badges;
DROP POLICY IF EXISTS "Enable delete for all users" ON commercial_badges;

DROP POLICY IF EXISTS "Enable read access for all users" ON commercial_user_badges;
DROP POLICY IF EXISTS "Enable insert for all users" ON commercial_user_badges;
DROP POLICY IF EXISTS "Enable update for all users" ON commercial_user_badges;
DROP POLICY IF EXISTS "Enable delete for all users" ON commercial_user_badges;

DROP POLICY IF EXISTS "Enable read access for all users" ON commercial_alerts;
DROP POLICY IF EXISTS "Enable insert for all users" ON commercial_alerts;
DROP POLICY IF EXISTS "Enable update for all users" ON commercial_alerts;
DROP POLICY IF EXISTS "Enable delete for all users" ON commercial_alerts;

-- 3. VÉRIFIER QUE RLS EST DÉSACTIVÉ
SELECT 
  schemaname,
  tablename,
  rowsecurity
FROM pg_tables 
WHERE tablename LIKE 'commercial_%'
ORDER BY tablename;

-- 4. TESTER L'INSERTION D'UN RDV
INSERT INTO commercial_meetings (
  calleur_id,
  lead_name,
  lead_phone,
  lead_email,
  meeting_date,
  meeting_duration,
  meeting_status,
  meeting_result,
  notes
)
VALUES (
  '470c709c-abce-48c8-b8b3-320cd98a5ed5'::UUID,
  'Test Lead',
  '+33123456789',
  'test@lead.com',
  NOW(),
  60,
  'scheduled',
  'follow_up_needed',
  'Test de création de RDV'
);

-- 5. VÉRIFIER QUE LE RDV A ÉTÉ CRÉÉ
SELECT 
  id,
  calleur_id,
  lead_name,
  lead_phone,
  lead_email,
  meeting_status,
  created_at
FROM commercial_meetings 
WHERE calleur_id = '470c709c-abce-48c8-b8b3-320cd98a5ed5'::UUID
ORDER BY created_at DESC;

-- 6. TESTER LA FONCTION AVEC DES DONNÉES
SELECT 'Test fonction avec données:' as info;
SELECT * FROM get_commercial_stats('470c709c-abce-48c8-b8b3-320cd98a5ed5'::UUID);
