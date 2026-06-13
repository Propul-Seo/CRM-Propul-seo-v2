-- =====================================================
-- CRÉATION D'UN UTILISATEUR DE TEST
-- =====================================================

-- 1. Créer l'utilisateur de test dans commercial_users
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
ON CONFLICT (id) DO NOTHING;

-- 2. Créer le profil de points pour l'utilisateur de test
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
ON CONFLICT (calleur_id) DO NOTHING;

-- 3. Vérifier que l'utilisateur a été créé
SELECT 
  cu.id,
  cu.name,
  cu.email,
  cu.role,
  cu.is_active,
  cu.target_calls_per_day,
  cu.target_rdv_per_week,
  cu.target_deals_per_month,
  cu.commission_rate,
  cp.points_total,
  cp.level
FROM commercial_users cu
LEFT JOIN commercial_points cp ON cu.id = cp.calleur_id
WHERE cu.id = '470c709c-abce-48c8-b8b3-320cd98a5ed5'::UUID;

-- 4. Tester les fonctions avec l'utilisateur de test
SELECT 'Test get_commercial_stats avec utilisateur test:' as test_name;
SELECT * FROM get_commercial_stats('470c709c-abce-48c8-b8b3-320cd98a5ed5'::UUID);
