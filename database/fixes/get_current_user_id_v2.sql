-- =====================================================
-- OBTENIR L'ID DE L'UTILISATEUR ACTUEL - VERSION 2
-- =====================================================

-- 1. Obtenir l'ID de l'utilisateur actuellement connecté
SELECT auth.uid() as current_user_id;

-- 2. Vérifier si cet utilisateur existe dans commercial_users
SELECT 
  cu.id,
  cu.name,
  cu.email,
  cu.role,
  cu.is_active
FROM commercial_users cu
WHERE cu.user_id = auth.uid();

-- 3. Si l'utilisateur n'existe pas, créer un profil commercial
INSERT INTO commercial_users (
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
SELECT 
  auth.uid(),
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  au.email,
  'commercial',
  true,
  10,
  5,
  3,
  5.0,
  NOW(),
  NOW()
FROM auth.users au
WHERE au.id = auth.uid()
AND NOT EXISTS (
  SELECT 1 FROM commercial_users 
  WHERE user_id = auth.uid()
);

-- 4. Créer le profil de points pour l'utilisateur actuel
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
  cu.id,
  0,
  0,
  0,
  0,
  0,
  1,
  NOW(),
  NOW()
FROM commercial_users cu
WHERE cu.user_id = auth.uid()
AND NOT EXISTS (
  SELECT 1 FROM commercial_points 
  WHERE calleur_id = cu.id
);

-- 5. Afficher le profil final
SELECT 
  cu.id as commercial_user_id,
  cu.name,
  cu.email,
  cu.role,
  cu.is_active,
  cp.points_total,
  cp.level
FROM commercial_users cu
LEFT JOIN commercial_points cp ON cu.id = cp.calleur_id
WHERE cu.user_id = auth.uid();
