-- =====================================================
-- NETTOYAGE DÉFINITIF CRM BYW + RENOMMAGE
-- =====================================================

-- 1. SUPPRIMER DÉFINITIVEMENT TOUTES LES DONNÉES DE TEST
DELETE FROM crm_byw_records;
DELETE FROM crm_byw_columns;

-- 2. RENOMMER LES COLONNES POUR "BUILD YOUR WAY"
-- Mettre à jour les noms des colonnes existantes
UPDATE crm_byw_columns SET 
    column_name = 'Présentation Envoyé',
    display_config = '{"colors": {"Non": "red", "En cours": "orange", "Oui": "green"}}'::jsonb
WHERE column_name = 'Présentation Envoyé';

UPDATE crm_byw_columns SET 
    column_name = 'RDV',
    display_config = '{"colors": {"Non planifié": "gray", "Planifié": "blue", "Réalisé": "green", "Reporté": "orange", "Annulé": "red"}}'::jsonb
WHERE column_name = 'RDV';

UPDATE crm_byw_columns SET 
    column_name = 'Beta Testeur',
    display_config = '{"colors": {"Non proposé": "gray", "En attente": "orange", "Accepté": "green", "Refusé": "red"}}'::jsonb
WHERE column_name = 'Beta Testeur';

UPDATE crm_byw_columns SET 
    column_name = 'Demo',
    display_config = '{"colors": {"Non programmée": "gray", "Programmée": "blue", "Réalisée": "green", "Reportée": "orange", "Intéressé": "yellow", "Pas intéressé": "red"}}'::jsonb
WHERE column_name = 'Demo';

UPDATE crm_byw_columns SET 
    column_name = 'Client',
    display_config = '{"colors": {"Prospect": "gray", "En réflexion": "yellow", "Devis envoyé": "blue", "Négociation": "orange", "Converti": "green"}}'::jsonb
WHERE column_name = 'Client';

UPDATE crm_byw_columns SET 
    column_name = 'Perdu',
    display_config = '{"colors": {"Non": "green", "Oui": "red"}}'::jsonb
WHERE column_name = 'Perdu';

-- 3. RECRÉER LES COLONNES AVEC LES BONS NOMS
-- Supprimer et recréer les colonnes pour "Build Your Way"
DELETE FROM crm_byw_columns;

-- Fonction pour initialiser les colonnes BYW (Build Your Way)
CREATE OR REPLACE FUNCTION init_byw_default_columns(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    -- Vérifier si l'utilisateur a déjà des colonnes
    IF EXISTS (SELECT 1 FROM crm_byw_columns WHERE user_id = user_uuid) THEN
        RETURN;
    END IF;

    -- Insérer les colonnes par défaut pour "Build Your Way"
    INSERT INTO crm_byw_columns (user_id, column_name, column_type, column_order, is_default, options, display_config) VALUES
    (user_uuid, 'Présentation Envoyé', 'select', 1, true, 
     '["Non", "En cours", "Oui"]'::jsonb,
     '{"colors": {"Non": "red", "En cours": "orange", "Oui": "green"}}'::jsonb),
    
    (user_uuid, 'RDV', 'select', 2, true, 
     '["Non planifié", "Planifié", "Réalisé", "Reporté", "Annulé"]'::jsonb,
     '{"colors": {"Non planifié": "gray", "Planifié": "blue", "Réalisé": "green", "Reporté": "orange", "Annulé": "red"}}'::jsonb),
    
    (user_uuid, 'Beta Testeur', 'select', 3, true, 
     '["Non proposé", "En attente", "Accepté", "Refusé"]'::jsonb,
     '{"colors": {"Non proposé": "gray", "En attente": "orange", "Accepté": "green", "Refusé": "red"}}'::jsonb),
    
    (user_uuid, 'Demo', 'select', 4, true, 
     '["Non programmée", "Programmée", "Réalisée", "Reportée", "Intéressé", "Pas intéressé"]'::jsonb,
     '{"colors": {"Non programmée": "gray", "Programmée": "blue", "Réalisée": "green", "Reportée": "orange", "Intéressé": "yellow", "Pas intéressé": "red"}}'::jsonb),
    
    (user_uuid, 'Client', 'select', 5, true, 
     '["Prospect", "En réflexion", "Devis envoyé", "Négociation", "Converti"]'::jsonb,
     '{"colors": {"Prospect": "gray", "En réflexion": "yellow", "Devis envoyé": "blue", "Négociation": "orange", "Converti": "green"}}'::jsonb),
    
    (user_uuid, 'Perdu', 'select', 6, true, 
     '["Non", "Oui"]'::jsonb,
     '{"colors": {"Non": "green", "Oui": "red"}}'::jsonb);
END;
$$ language 'plpgsql';

-- 4. INITIALISER LES COLONNES POUR TOUS LES UTILISATEURS
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id FROM auth.users LOOP
        -- Initialiser les colonnes par défaut
        PERFORM init_byw_default_columns(user_record.id);
    END LOOP;
END $$;

-- 5. VÉRIFICATION FINALE
SELECT 
    'Nettoyage terminé' as test,
    CASE 
        WHEN (SELECT COUNT(*) FROM crm_byw_records) = 0 
        AND (SELECT COUNT(*) FROM crm_byw_columns WHERE is_default = true) >= 6
        THEN '✅ SUCCÈS - Données supprimées, colonnes recréées'
        ELSE '❌ ÉCHEC'
    END as result;

-- Compter les colonnes créées
SELECT 
    'Colonnes Build Your Way' as test,
    COUNT(*) as count
FROM crm_byw_columns 
WHERE is_default = true;

-- Vérifier qu'il n'y a plus d'enregistrements
SELECT 
    'Enregistrements restants' as test,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ AUCUNE DONNÉE DE TEST'
        ELSE '❌ DONNÉES RESTANTES'
    END as result
FROM crm_byw_records;
