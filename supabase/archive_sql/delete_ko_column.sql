-- Script pour supprimer la colonne "KO" du CRM

-- 1. Vérifier si la colonne "KO" existe
SELECT id, column_id, title, position, is_active 
FROM crm_columns 
WHERE title ILIKE '%ko%' OR column_id ILIKE '%ko%';

-- 2. Supprimer la colonne "KO" si elle existe
DELETE FROM crm_columns 
WHERE title ILIKE '%ko%' OR column_id ILIKE '%ko%';

-- 3. Vérifier que la colonne a été supprimée
SELECT id, column_id, title, position, is_active 
FROM crm_columns 
ORDER BY position;

-- 4. Optionnel: Mettre à jour les contacts qui étaient dans la colonne "KO"
-- (Déplacer vers une autre colonne comme "prospects")
-- UPDATE contacts SET status = 'prospect' WHERE status = 'ko';
