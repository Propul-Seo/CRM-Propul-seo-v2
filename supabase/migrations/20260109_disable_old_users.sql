-- =====================================================
-- Migration: Disable Paul and Antoine Users
-- Date: 2026-01-09
-- Purpose: Transition to single-user mode (Titi/Etienne only)
-- =====================================================

-- Option 1: Desactiver les comptes (plus sur, garde l'historique)
UPDATE users
SET
  is_active = false,
  updated_at = NOW()
WHERE email IN (
  'paulfst.business@gmail.com',
  'bigot.antoine64@gmail.com'
);

-- Ajouter une note dans les metadonnees pour indiquer la raison
UPDATE users
SET
  bio = CONCAT(COALESCE(bio, ''), ' [Compte desactive le ', NOW()::DATE, ' - Passage en mode mono-utilisateur]')
WHERE email IN (
  'paulfst.business@gmail.com',
  'bigot.antoine64@gmail.com'
);

-- Mettre a NULL les references de responsible_user_id dans accounting_entries
-- pour les entrees attribuees a Paul ou Antoine
UPDATE accounting_entries
SET
  responsible_user_id = NULL,
  responsible_user_name = NULL,
  updated_at = NOW()
WHERE responsible_user_id IN (
  SELECT id FROM users WHERE email IN (
    'paulfst.business@gmail.com',
    'bigot.antoine64@gmail.com'
  )
);

-- Alternative: Si vous voulez supprimer completement les utilisateurs
-- ATTENTION: Decommenter uniquement si vous etes sur de vouloir supprimer les donnees
-- DELETE FROM users WHERE email IN ('paulfst.business@gmail.com', 'bigot.antoine64@gmail.com');

-- =====================================================
-- COMMENTAIRES
-- =====================================================
COMMENT ON TABLE users IS 'Table utilisateurs - Mode mono-utilisateur depuis Janvier 2026';
