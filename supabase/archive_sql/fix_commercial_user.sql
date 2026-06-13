-- =====================================================
-- CRÉATION DE L'UTILISATEUR COMMERCIAL MANQUANT
-- =====================================================

-- 1. Vérifier si l'utilisateur existe dans auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE id = '470c709c-abce-48c8-b8b3-320cd98a5ed5'::UUID;

-- 2. Créer l'utilisateur commercial s'il n'existe pas
INSERT INTO commercial_users (
  id,
  user_id,
  name,
  email,
  phone,
  role,
  is_active,
  target_calls_per_day,
  target_rdv_per_week,
  target_deals_per_month,
  commission_rate,
  created_at,
  updated_at
)
SELECT 
  '470c709c-abce-48c8-b8b3-320cd98a5ed5'::UUID,
  '470c709c-abce-48c8-b8b3-320cd98a5ed5'::UUID,
  'Utilisateur Test',
  'test@example.com',
  '+33123456789',
  'commercial',
  true,
  10,
  5,
  3,
  5.0,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM commercial_users 
  WHERE id = '470c709c-abce-48c8-b8b3-320cd98a5ed5'::UUID
);

-- 3. Créer le profil de points pour cet utilisateur
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
SELECT 
  '470c709c-abce-48c8-b8b3-320cd98a5ed5'::UUID,
  0,
  0,
  0,
  0,
  0,
  1,
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM commercial_points 
  WHERE calleur_id = '470c709c-abce-48c8-b8b3-320cd98a5ed5'::UUID
);

-- 4. Vérifier que l'utilisateur a été créé
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
