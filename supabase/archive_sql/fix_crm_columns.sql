-- Script pour corriger la table crm_columns existante

-- Ajouter la colonne column_id si elle n'existe pas
ALTER TABLE crm_columns ADD COLUMN IF NOT EXISTS column_id VARCHAR(50);

-- Mettre à jour les colonnes existantes avec des column_id basés sur leur titre
UPDATE crm_columns SET column_id = 'prospects' WHERE title = 'Prospects';
UPDATE crm_columns SET column_id = 'presentation_envoyee' WHERE title = 'Présentation Envoyée';
UPDATE crm_columns SET column_id = 'meeting_booke' WHERE title = 'Meeting Booké';
UPDATE crm_columns SET column_id = 'offre_envoyee' WHERE title = 'Offre Envoyée';
UPDATE crm_columns SET column_id = 'en_attente' WHERE title = 'En Attente';
UPDATE crm_columns SET column_id = 'signes' WHERE title = 'Signés';

-- Rendre la colonne column_id NOT NULL
ALTER TABLE crm_columns ALTER COLUMN column_id SET NOT NULL;

-- Ajouter une contrainte d'unicité
ALTER TABLE crm_columns ADD CONSTRAINT unique_column_id UNIQUE (column_id);

-- Vérifier le résultat
SELECT id, column_id, title, color, header_color, position, is_active FROM crm_columns ORDER BY position;
