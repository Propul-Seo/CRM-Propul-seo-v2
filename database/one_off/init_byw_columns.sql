-- =====================================================
-- INITIALISATION DES COLONNES BYW PAR DÉFAUT
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
-- INITIALISATION POUR TOUS LES UTILISATEURS EXISTANTS
-- =====================================================

-- Initialiser les colonnes pour tous les utilisateurs existants
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id FROM auth.users LOOP
        -- Initialiser les colonnes par défaut
        PERFORM init_byw_default_columns(user_record.id);
        
        -- Insérer quelques enregistrements de test pour chaque utilisateur
        INSERT INTO crm_byw_records (user_id, company_name, contact_name, email, phone, presentation_envoye, rdv, beta_testeur, demo, client, perdu, source, notes) VALUES
        (user_record.id, 'TechCorp Solutions', 'Marie Dubois', 'marie@techcorp.com', '01 23 45 67 89', 'Oui', 'Planifié', 'En attente', 'Programmée', 'En réflexion', 'Non', 'Site web', 'Lead intéressé par nos services'),
        (user_record.id, 'Digital Agency Pro', 'Pierre Martin', 'pierre@digitalagency.com', '01 98 76 54 32', 'En cours', 'Réalisé', 'Accepté', 'Réalisée', 'Converti', 'Non', 'LinkedIn', 'Client converti avec succès'),
        (user_record.id, 'Startup Innovante', 'Sophie Leroy', 'sophie@startup.com', '06 12 34 56 78', 'Non', 'Non planifié', 'Non proposé', 'Non programmée', 'Prospect', 'Non', 'Email', 'Nouveau prospect à contacter'),
        (user_record.id, 'Entreprise Classique', 'Jean Dupont', 'jean@entreprise.com', '01 11 22 33 44', 'Oui', 'Reporté', 'Refusé', 'Pas intéressé', 'Prospect', 'Oui', 'Téléphone', 'Lead perdu - pas intéressé')
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

-- Vérifier que les enregistrements de test ont été créés
SELECT 
    'Enregistrements de test' as test,
    COUNT(*) as count,
    CASE 
        WHEN COUNT(*) > 0 THEN '✅ SUCCÈS'
        ELSE '❌ ÉCHEC'
    END as result
FROM crm_byw_records;

-- Afficher un échantillon des données
SELECT 
    'Échantillon des données' as info,
    company_name,
    contact_name,
    presentation_envoye,
    rdv,
    client,
    perdu
FROM crm_byw_records
LIMIT 5;
