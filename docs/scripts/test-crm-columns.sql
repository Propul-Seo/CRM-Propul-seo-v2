-- Script de test pour la table crm_columns
-- À exécuter après avoir appliqué la migration

-- 1. Vérifier que la table existe
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'crm_columns'
ORDER BY ordinal_position;

-- 2. Vérifier les données initiales
SELECT * FROM crm_columns ORDER BY position;

-- 3. Tester l'insertion d'une nouvelle colonne
INSERT INTO crm_columns (id, title, color, header_color, position) VALUES
('test_column', 'Colonne de Test', 'bg-pink-50 border-pink-200', 'bg-pink-500', 7);

-- 4. Vérifier l'insertion
SELECT * FROM crm_columns WHERE id = 'test_column';

-- 5. Tester la désactivation d'une colonne
UPDATE crm_columns SET is_active = false WHERE id = 'test_column';

-- 6. Vérifier que la colonne n'apparaît plus dans les colonnes actives
SELECT * FROM crm_columns WHERE is_active = true ORDER BY position;

-- 7. Tester la réactivation
UPDATE crm_columns SET is_active = true WHERE id = 'test_column';

-- 8. Nettoyer les données de test
DELETE FROM crm_columns WHERE id = 'test_column';

-- 9. Vérifier l'état final
SELECT * FROM crm_columns WHERE is_active = true ORDER BY position;
