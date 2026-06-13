-- Migration pour ajouter les nouveaux statuts CRM
-- Date: 2025-01-18

-- 1. Créer un nouveau type enum avec tous les statuts
CREATE TYPE client_status_new AS ENUM (
  'prospect',
  'signe',
  'proposition_envoyee',
  'meeting_booke',
  'offre_envoyee',
  'en_attente'
);

-- 2. Mettre à jour la table contacts pour utiliser le nouveau type
ALTER TABLE contacts 
  ALTER COLUMN status TYPE client_status_new 
  USING status::text::client_status_new;

-- 3. Supprimer l'ancien type et renommer le nouveau
DROP TYPE client_status;
ALTER TYPE client_status_new RENAME TO client_status;

-- 4. Vérifier que la migration s'est bien passée
SELECT 
  'Migration CRM statuses completed' as status,
  COUNT(*) as total_contacts,
  status,
  COUNT(*) as count_by_status
FROM contacts 
GROUP BY status 
ORDER BY count_by_status DESC; 