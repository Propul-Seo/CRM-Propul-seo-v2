-- =====================================================
-- NETTOYAGE DES DONNÉES DE TEST BYW
-- =====================================================

-- Supprimer tous les enregistrements de test existants
DELETE FROM crm_byw_records;

-- Supprimer toutes les colonnes existantes pour repartir à zéro
DELETE FROM crm_byw_columns;

-- Réinitialiser les séquences si nécessaire
-- (PostgreSQL gère automatiquement les UUIDs, pas besoin de reset)

-- =====================================================
-- CRÉATION D'UN SEUL ENREGISTREMENT DE TEST
-- =====================================================

-- Fonction pour initialiser les colonnes BYW par défaut pour un utilisateur
CREATE OR REPLACE FUNCTION init_byw_default_columns(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
    -- Vérifier si l'utilisateur a déjà des colonnes
    IF EXISTS (SELECT 1 FROM crm_byw_columns WHERE user_id = user_uuid) THEN
        RETURN; -- L'utilisateur a déjà des colonnes, ne pas les recréer
    END IF;

    -- Insérer les colonnes par défaut
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

-- =====================================================
-- INITIALISATION MINIMALE POUR TOUS LES UTILISATEURS
-- =====================================================

-- Initialiser les colonnes pour tous les utilisateurs existants
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id FROM auth.users LOOP
        -- Initialiser les colonnes par défaut
        PERFORM init_byw_default_columns(user_record.id);
        
        -- Insérer UN SEUL enregistrement de test par utilisateur
        INSERT INTO crm_byw_records (user_id, company_name, contact_name, email, phone, presentation_envoye, rdv, beta_testeur, demo, client, perdu, source, notes) VALUES
        (user_record.id, 'Exemple Entreprise', 'Contact Test', 'test@exemple.com', '01 23 45 67 89', 'Non', 'Non planifié', 'Non proposé', 'Non programmée', 'Prospect', 'Non', 'Test', 'Enregistrement de démonstration')
        ON CONFLICT DO NOTHING; -- Éviter les doublons
    END LOOP;
END $$;

-- =====================================================
-- VÉRIFICATION FINALE
-- =====================================================

-- Vérifier que les colonnes ont été créées
SELECT 
    'Colonnes BYW créées' as test,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) >= 6 THEN '✅ SUCCÈS'
        ELSE '❌ ÉCHEC'
    END as result
FROM crm_byw_columns 
WHERE is_default = true;

-- Vérifier le nombre d'enregistrements (doit être égal au nombre d'utilisateurs)
SELECT 
    'Enregistrements de test' as test,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) > 0 AND COUNT(*) <= 5 THEN '✅ SUCCÈS - Nombre raisonnable'
        WHEN COUNT(*) > 5 THEN '⚠️ TROP DE DONNÉES'
        ELSE '❌ ÉCHEC'
    END as result
FROM crm_byw_records;

-- Afficher les données restantes
SELECT 
    'Données restantes' as info,
    company_name,
    contact_name,
    presentation_envoye,
    rdv,
    client
FROM crm_byw_records
ORDER BY created_at DESC;
