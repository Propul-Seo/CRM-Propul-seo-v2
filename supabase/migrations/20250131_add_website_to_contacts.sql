-- Migration pour ajouter le champ website à la table contacts
-- Date: 2025-01-31

-- Ajouter la colonne website à la table contacts
ALTER TABLE contacts ADD COLUMN IF NOT EXISTS website TEXT;

-- Ajouter un commentaire pour documenter le champ
COMMENT ON COLUMN contacts.website IS 'Site internet du contact (optionnel)';

-- Mettre à jour la fonction de mise à jour automatique updated_at si elle existe
-- (Cette partie peut être omise si la fonction n'existe pas encore)
