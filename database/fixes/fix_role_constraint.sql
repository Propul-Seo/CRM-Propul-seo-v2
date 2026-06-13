-- =====================================================
-- CORRECTION DE LA CONTRAINTE DE RÔLE
-- =====================================================

-- 1. Vérifier les contraintes existantes
SELECT 
  conname as constraint_name,
  pg_get_constraintdef(oid) as constraint_definition
FROM pg_constraint 
WHERE conrelid = 'commercial_users'::regclass 
AND contype = 'c';

-- 2. Supprimer la contrainte de rôle si elle existe
ALTER TABLE commercial_users DROP CONSTRAINT IF EXISTS commercial_users_role_check;

-- 3. Créer une nouvelle contrainte de rôle plus permissive
ALTER TABLE commercial_users ADD CONSTRAINT commercial_users_role_check 
CHECK (role IN ('commercial', 'manager', 'admin', 'supervisor', 'director'));

-- 4. Créer l'utilisateur de test avec un rôle valide
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
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();

-- 5. Vérifier que l'utilisateur a été créé
SELECT 
  id,
  name,
  email,
  role,
  is_active
FROM commercial_users 
WHERE id = '470c709c-abce-48c8-b8b3-320cd98a5ed5'::UUID;
