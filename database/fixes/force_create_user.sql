-- =====================================================
-- FORCER LA CRÉATION DE L'UTILISATEUR COMMERCIAL
-- =====================================================

-- 1. Supprimer temporairement la contrainte de foreign key si elle existe
-- (Cette commande peut échouer si la contrainte n'existe pas, c'est normal)
ALTER TABLE commercial_points DROP CONSTRAINT IF EXISTS commercial_points_calleur_id_fkey;

-- 2. Créer l'utilisateur commercial
INSERT INTO commercial_users (
  id,
  user_id,
  name,
  email,
  role,
  is_active,
  target_calls_per_day,
  target_rdv_per_week,
  target_deals_per_month,
  commission_rate,
  created_at,
  updated_at
)
VALUES (
  '470c709c-abce-48c8-b8b3-320cd98a5ed5'::UUID,
  '470c709c-abce-48c8-b8b3-320cd98a5ed5'::UUID,
  'Utilisateur Test',
  'test@example.com',
  'commercial',
  true,
  10,
  5,
  3,
  5.0,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 3. Créer le profil de points
INSERT INTO commercial_points (
  calleur_id,
  points_total,
  points_calls,
  points_rdv,
  points_deals,
  points_bonus,
  level,
  created_at,
  updated_at
)
VALUES (
  '470c709c-abce-48c8-b8b3-320cd98a5ed5'::UUID,
  0,
  0,
  0,
  0,
  0,
  1,
  NOW(),
  NOW()
)
ON CONFLICT (calleur_id) DO UPDATE SET
  points_total = EXCLUDED.points_total,
  points_calls = EXCLUDED.points_calls,
  points_rdv = EXCLUDED.points_rdv,
  points_deals = EXCLUDED.points_deals,
  points_bonus = EXCLUDED.points_bonus,
  level = EXCLUDED.level,
  updated_at = NOW();

-- 4. Recréer la contrainte de foreign key
ALTER TABLE commercial_points 
ADD CONSTRAINT commercial_points_calleur_id_fkey 
FOREIGN KEY (calleur_id) REFERENCES commercial_users(id) ON DELETE CASCADE;

-- 5. Vérifier que tout a été créé correctement
SELECT 
  cu.id,
  cu.name,
  cu.email,
  cu.role,
  cu.is_active,
  cp.points_total,
  cp.level
FROM commercial_users cu
LEFT JOIN commercial_points cp ON cu.id = cp.calleur_id
WHERE cu.id = '470c709c-abce-48c8-b8b3-320cd98a5ed5'::UUID;

-- 6. Tester les fonctions
SELECT 'Test get_commercial_stats:' as test_name;
SELECT * FROM get_commercial_stats('470c709c-abce-48c8-b8b3-320cd98a5ed5'::UUID);
