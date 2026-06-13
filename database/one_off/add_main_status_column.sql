-- =====================================================
-- AJOUT DE LA COLONNE MAIN_STATUS
-- =====================================================

-- Ajouter la colonne main_status à la table crm_byw_records
ALTER TABLE crm_byw_records 
ADD COLUMN IF NOT EXISTS main_status VARCHAR(50) DEFAULT 'presentation_envoye';

-- Mettre à jour les enregistrements existants avec un statut par défaut
UPDATE crm_byw_records 
SET main_status = 'presentation_envoye' 
WHERE main_status IS NULL;

-- Créer un index sur la colonne main_status pour les performances
CREATE INDEX IF NOT EXISTS idx_crm_byw_main_status ON crm_byw_records(main_status);

-- Vérifier que la colonne a été ajoutée
SELECT 
    'Colonne main_status ajoutée' as test,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'crm_byw_records' 
            AND column_name = 'main_status'
        ) THEN '✅ SUCCÈS'
        ELSE '❌ ÉCHEC'
    END as result;

-- Afficher un échantillon des données avec main_status
SELECT 
    'Données avec main_status' as info,
    company_name,
    contact_name,
    main_status,
    presentation_envoye,
    rdv,
    client
FROM crm_byw_records
LIMIT 3;
