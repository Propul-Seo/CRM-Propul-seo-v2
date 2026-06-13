-- Script de test pour vérifier la table crm_columns

-- Vérifier si la table existe
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns 
WHERE table_name = 'crm_columns' 
ORDER BY ordinal_position;

-- Vérifier les contraintes
SELECT 
  constraint_name,
  constraint_type
FROM information_schema.table_constraints 
WHERE table_name = 'crm_columns';

-- Tester l'insertion d'une colonne de test
INSERT INTO crm_columns (column_id, title, color, header_color, is_active, position)
VALUES ('test_colonne', 'Test Colonne', 'bg-blue-50', 'bg-blue-100', true, 999)
RETURNING *;

-- Supprimer la colonne de test
DELETE FROM crm_columns WHERE title = 'Test Colonne';

-- Afficher les colonnes existantes
SELECT * FROM crm_columns ORDER BY position;
