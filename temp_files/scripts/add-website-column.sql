-- Script SQL pour ajouter le champ website à la table contacts
-- À exécuter dans l'interface SQL de Supabase

-- Vérifier si la colonne existe déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contacts' AND column_name = 'website'
    ) THEN
        -- Ajouter la colonne website
        ALTER TABLE contacts ADD COLUMN website TEXT;
        
        -- Ajouter un commentaire
        COMMENT ON COLUMN contacts.website IS 'Site internet du contact (optionnel)';
        
        RAISE NOTICE 'Colonne website ajoutée avec succès';
    ELSE
        RAISE NOTICE 'La colonne website existe déjà';
    END IF;
END $$;
