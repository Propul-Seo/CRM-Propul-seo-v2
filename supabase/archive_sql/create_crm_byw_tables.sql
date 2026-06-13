-- =====================================================
-- CRÉATION DES TABLES CRM BYW
-- =====================================================

-- Table principale pour les données CRM BYW
CREATE TABLE crm_byw_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Informations de base du contact/entreprise
    company_name VARCHAR(255),
    contact_name VARCHAR(255),
    email VARCHAR(255),
    phone VARCHAR(50),
    
    -- Colonnes spécifiques BYW avec valeurs par défaut
    presentation_envoye VARCHAR(50) DEFAULT 'Non',
    rdv VARCHAR(50) DEFAULT 'Non planifié',
    beta_testeur VARCHAR(50) DEFAULT 'Non proposé',
    demo VARCHAR(50) DEFAULT 'Non programmée',
    client VARCHAR(50) DEFAULT 'Prospect',
    perdu VARCHAR(50) DEFAULT 'Non',
    
    -- Données supplémentaires (colonnes dynamiques)
    custom_data JSONB NOT NULL DEFAULT '{}',
    
    -- Méta-données
    notes TEXT,
    tags TEXT[] DEFAULT ARRAY[]::TEXT[],
    priority INTEGER DEFAULT 3, -- 1=Haute, 2=Moyenne, 3=Basse
    assigned_to UUID REFERENCES auth.users(id),
    source VARCHAR(100), -- D'où vient ce lead
    
    -- Dates importantes
    presentation_sent_date TIMESTAMP WITH TIME ZONE,
    rdv_date TIMESTAMP WITH TIME ZONE,
    beta_start_date TIMESTAMP WITH TIME ZONE,
    demo_date TIMESTAMP WITH TIME ZONE,
    conversion_date TIMESTAMP WITH TIME ZONE,
    lost_date TIMESTAMP WITH TIME ZONE,
    
    -- Audit
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'active'
);

-- Table pour la configuration des colonnes personnalisées BYW
CREATE TABLE crm_byw_columns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    column_name VARCHAR(255) NOT NULL,
    column_type VARCHAR(100) NOT NULL,
    column_order INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT FALSE,
    is_default BOOLEAN DEFAULT FALSE,
    default_value TEXT,
    options JSONB,
    validation_rules JSONB,
    display_config JSONB, -- Couleurs, icônes, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, column_name)
);

-- Table pour l'historique des changements d'état BYW
CREATE TABLE crm_byw_status_history (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    record_id UUID REFERENCES crm_byw_records(id) ON DELETE CASCADE,
    column_name VARCHAR(255) NOT NULL,
    old_value VARCHAR(255),
    new_value VARCHAR(255),
    changed_by UUID REFERENCES auth.users(id),
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    notes TEXT
);

-- =====================================================
-- INDEX ET OPTIMISATIONS
-- =====================================================

-- Index pour les performances
CREATE INDEX idx_crm_byw_records_user_id ON crm_byw_records(user_id);
CREATE INDEX idx_crm_byw_records_status ON crm_byw_records(status);
CREATE INDEX idx_crm_byw_records_created_at ON crm_byw_records(created_at DESC);
CREATE INDEX idx_crm_byw_records_company ON crm_byw_records(company_name);
CREATE INDEX idx_crm_byw_records_email ON crm_byw_records(email);
CREATE INDEX idx_crm_byw_records_assigned ON crm_byw_records(assigned_to);

-- Index sur les colonnes BYW spécifiques pour les filtres
CREATE INDEX idx_crm_byw_presentation ON crm_byw_records(presentation_envoye);
CREATE INDEX idx_crm_byw_rdv ON crm_byw_records(rdv);
CREATE INDEX idx_crm_byw_demo ON crm_byw_records(demo);
CREATE INDEX idx_crm_byw_client ON crm_byw_records(client);
CREATE INDEX idx_crm_byw_perdu ON crm_byw_records(perdu);

-- Index sur les colonnes personnalisées
CREATE INDEX idx_crm_byw_columns_user_id ON crm_byw_columns(user_id);
CREATE INDEX idx_crm_byw_columns_order ON crm_byw_columns(column_order);

-- Index sur l'historique
CREATE INDEX idx_crm_byw_history_record ON crm_byw_status_history(record_id);
CREATE INDEX idx_crm_byw_history_date ON crm_byw_status_history(changed_at DESC);

-- =====================================================
-- TRIGGERS ET FONCTIONS
-- =====================================================

-- Fonction pour mettre à jour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour updated_at sur crm_byw_records
CREATE TRIGGER update_crm_byw_records_updated_at 
    BEFORE UPDATE ON crm_byw_records 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- Fonction pour enregistrer l'historique des changements
CREATE OR REPLACE FUNCTION log_byw_status_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Vérifier les changements sur les colonnes BYW
    IF OLD.presentation_envoye IS DISTINCT FROM NEW.presentation_envoye THEN
        INSERT INTO crm_byw_status_history (record_id, column_name, old_value, new_value, changed_by)
        VALUES (NEW.id, 'presentation_envoye', OLD.presentation_envoye, NEW.presentation_envoye, auth.uid());
    END IF;
    
    IF OLD.rdv IS DISTINCT FROM NEW.rdv THEN
        INSERT INTO crm_byw_status_history (record_id, column_name, old_value, new_value, changed_by)
        VALUES (NEW.id, 'rdv', OLD.rdv, NEW.rdv, auth.uid());
    END IF;
    
    IF OLD.beta_testeur IS DISTINCT FROM NEW.beta_testeur THEN
        INSERT INTO crm_byw_status_history (record_id, column_name, old_value, new_value, changed_by)
        VALUES (NEW.id, 'beta_testeur', OLD.beta_testeur, NEW.beta_testeur, auth.uid());
    END IF;
    
    IF OLD.demo IS DISTINCT FROM NEW.demo THEN
        INSERT INTO crm_byw_status_history (record_id, column_name, old_value, new_value, changed_by)
        VALUES (NEW.id, 'demo', OLD.demo, NEW.demo, auth.uid());
    END IF;
    
    IF OLD.client IS DISTINCT FROM NEW.client THEN
        INSERT INTO crm_byw_status_history (record_id, column_name, old_value, new_value, changed_by)
        VALUES (NEW.id, 'client', OLD.client, NEW.client, auth.uid());
    END IF;
    
    IF OLD.perdu IS DISTINCT FROM NEW.perdu THEN
        INSERT INTO crm_byw_status_history (record_id, column_name, old_value, new_value, changed_by)
        VALUES (NEW.id, 'perdu', OLD.perdu, NEW.perdu, auth.uid());
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger pour l'historique
CREATE TRIGGER log_crm_byw_status_change
    AFTER UPDATE ON crm_byw_records
    FOR EACH ROW EXECUTE PROCEDURE log_byw_status_change();

-- =====================================================
-- POLITIQUES RLS
-- =====================================================

-- Activer RLS
ALTER TABLE crm_byw_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_byw_columns ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_byw_status_history ENABLE ROW LEVEL SECURITY;

-- Politiques pour crm_byw_records
CREATE POLICY "Users can view their own CRM BYW records" 
    ON crm_byw_records FOR SELECT 
    USING (auth.uid() = user_id OR auth.uid() = assigned_to);

CREATE POLICY "Users can insert their own CRM BYW records" 
    ON crm_byw_records FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own CRM BYW records" 
    ON crm_byw_records FOR UPDATE 
    USING (auth.uid() = user_id OR auth.uid() = assigned_to);

CREATE POLICY "Users can delete their own CRM BYW records" 
    ON crm_byw_records FOR DELETE 
    USING (auth.uid() = user_id);

-- Politiques pour crm_byw_columns
CREATE POLICY "Users can view their own CRM BYW columns" 
    ON crm_byw_columns FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own CRM BYW columns" 
    ON crm_byw_columns FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own CRM BYW columns" 
    ON crm_byw_columns FOR UPDATE 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own CRM BYW columns" 
    ON crm_byw_columns FOR DELETE 
    USING (auth.uid() = user_id);

-- Politiques pour l'historique
CREATE POLICY "Users can view BYW status history for their records" 
    ON crm_byw_status_history FOR SELECT 
    USING (EXISTS (
        SELECT 1 FROM crm_byw_records 
        WHERE id = record_id AND (user_id = auth.uid() OR assigned_to = auth.uid())
    ));

-- =====================================================
-- FONCTION D'INITIALISATION DES COLONNES PAR DÉFAUT
-- =====================================================

-- Fonction pour initialiser les colonnes BYW par défaut pour un utilisateur
CREATE OR REPLACE FUNCTION init_byw_default_columns(user_uuid UUID)
RETURNS VOID AS $$
BEGIN
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
-- DONNÉES DE TEST
-- =====================================================

-- Insérer des données de test pour tous les utilisateurs existants
DO $$
DECLARE
    user_record RECORD;
BEGIN
    FOR user_record IN SELECT id FROM auth.users LOOP
        -- Initialiser les colonnes par défaut
        PERFORM init_byw_default_columns(user_record.id);
        
        -- Insérer quelques enregistrements de test
        INSERT INTO crm_byw_records (user_id, company_name, contact_name, email, phone, presentation_envoye, rdv, beta_testeur, demo, client, perdu, source) VALUES
        (user_record.id, 'TechCorp Solutions', 'Marie Dubois', 'marie@techcorp.com', '01 23 45 67 89', 'Oui', 'Planifié', 'En attente', 'Programmée', 'En réflexion', 'Non', 'Site web'),
        (user_record.id, 'Digital Agency Pro', 'Pierre Martin', 'pierre@digitalagency.com', '01 98 76 54 32', 'En cours', 'Réalisé', 'Accepté', 'Réalisée', 'Converti', 'Non', 'LinkedIn'),
        (user_record.id, 'Startup Innovante', 'Sophie Leroy', 'sophie@startup.com', '06 12 34 56 78', 'Non', 'Non planifié', 'Non proposé', 'Non programmée', 'Prospect', 'Non', 'Email'),
        (user_record.id, 'Entreprise Classique', 'Jean Dupont', 'jean@entreprise.com', '01 11 22 33 44', 'Oui', 'Reporté', 'Refusé', 'Pas intéressé', 'Prospect', 'Oui', 'Téléphone');
    END LOOP;
END $$;

-- =====================================================
-- VÉRIFICATION FINALE
-- =====================================================

-- Vérifier que tout est créé correctement
SELECT 
    'Tables créées' as test,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_byw_records')
        AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_byw_columns')
        AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_byw_status_history')
        THEN '✅ SUCCÈS'
        ELSE '❌ ÉCHEC'
    END as result;

-- Compter les colonnes créées
SELECT 
    'Colonnes par défaut' as test,
    COUNT(*) as count
FROM crm_byw_columns 
WHERE is_default = true;

-- Compter les enregistrements de test
SELECT 
    'Enregistrements de test' as test,
    COUNT(*) as count
FROM crm_byw_records;
