-- =====================================================
-- SCRIPT DE CRÉATION DES TABLES CRM BOT ONE
-- =====================================================
-- À exécuter dans le SQL Editor de Supabase
-- URL: https://tbuqctfgjjxnevmsvucl.supabase.co

-- 1. Table principale pour les données CRM Bot One
CREATE TABLE IF NOT EXISTS crm_bot_one_records (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    status VARCHAR(50) DEFAULT 'active',
    tags TEXT[] DEFAULT ARRAY[]::TEXT[]
);

-- 2. Table pour la configuration des colonnes personnalisées
CREATE TABLE IF NOT EXISTS crm_bot_one_columns (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    column_name VARCHAR(255) NOT NULL,
    column_type VARCHAR(100) NOT NULL, -- 'text', 'number', 'date', 'select', 'boolean', 'email', 'url'
    column_order INTEGER DEFAULT 0,
    is_required BOOLEAN DEFAULT FALSE,
    default_value TEXT,
    options JSONB, -- Pour les colonnes select/radio
    validation_rules JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_default BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, column_name)
);

-- 3. Index pour optimiser les performances
CREATE INDEX IF NOT EXISTS idx_crm_bot_one_records_user_id ON crm_bot_one_records(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_bot_one_records_created_at ON crm_bot_one_records(created_at);
CREATE INDEX IF NOT EXISTS idx_crm_bot_one_records_status ON crm_bot_one_records(status);
CREATE INDEX IF NOT EXISTS idx_crm_bot_one_columns_user_id ON crm_bot_one_columns(user_id);
CREATE INDEX IF NOT EXISTS idx_crm_bot_one_columns_order ON crm_bot_one_columns(column_order);

-- 4. Trigger pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Supprimer le trigger s'il existe déjà
DROP TRIGGER IF EXISTS update_crm_bot_one_records_updated_at ON crm_bot_one_records;

-- Créer le trigger
CREATE TRIGGER update_crm_bot_one_records_updated_at 
    BEFORE UPDATE ON crm_bot_one_records 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- 5. Activer RLS (Row Level Security)
ALTER TABLE crm_bot_one_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE crm_bot_one_columns ENABLE ROW LEVEL SECURITY;

-- 6. Politiques RLS pour crm_bot_one_records
DROP POLICY IF EXISTS "Users can view their own CRM Bot One records" ON crm_bot_one_records;
CREATE POLICY "Users can view their own CRM Bot One records" 
    ON crm_bot_one_records FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own CRM Bot One records" ON crm_bot_one_records;
CREATE POLICY "Users can insert their own CRM Bot One records" 
    ON crm_bot_one_records FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own CRM Bot One records" ON crm_bot_one_records;
CREATE POLICY "Users can update their own CRM Bot One records" 
    ON crm_bot_one_records FOR UPDATE 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own CRM Bot One records" ON crm_bot_one_records;
CREATE POLICY "Users can delete their own CRM Bot One records" 
    ON crm_bot_one_records FOR DELETE 
    USING (auth.uid() = user_id);

-- 7. Politiques RLS pour crm_bot_one_columns
DROP POLICY IF EXISTS "Users can view their own CRM Bot One columns" ON crm_bot_one_columns;
CREATE POLICY "Users can view their own CRM Bot One columns" 
    ON crm_bot_one_columns FOR SELECT 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own CRM Bot One columns" ON crm_bot_one_columns;
CREATE POLICY "Users can insert their own CRM Bot One columns" 
    ON crm_bot_one_columns FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own CRM Bot One columns" ON crm_bot_one_columns;
CREATE POLICY "Users can update their own CRM Bot One columns" 
    ON crm_bot_one_columns FOR UPDATE 
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own CRM Bot One columns" ON crm_bot_one_columns;
CREATE POLICY "Users can delete their own CRM Bot One columns" 
    ON crm_bot_one_columns FOR DELETE 
    USING (auth.uid() = user_id);

-- 8. Insérer des colonnes par défaut pour chaque utilisateur existant
-- Note: Cette requête sera exécutée automatiquement lors de la première connexion
INSERT INTO crm_bot_one_columns (user_id, column_name, column_type, column_order, is_required, is_default, default_value)
SELECT 
    u.id as user_id,
    column_name,
    column_type,
    column_order,
    is_required,
    true as is_default,
    default_value
FROM auth.users u
CROSS JOIN (VALUES 
    ('Nom', 'text', 1, true, ''),
    ('Email', 'email', 2, true, ''),
    ('Téléphone', 'text', 3, false, ''),
    ('Statut', 'select', 4, true, 'nouveau')
) AS default_columns(column_name, column_type, column_order, is_required, default_value)
WHERE u.id IS NOT NULL
ON CONFLICT (user_id, column_name) DO NOTHING;

-- 9. Vérification finale
SELECT 
    'Tables créées' as test,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_bot_one_records')
        AND EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'crm_bot_one_columns')
        THEN '✅ SUCCÈS'
        ELSE '❌ ÉCHEC'
    END as result

UNION ALL

SELECT 
    'Politiques RLS' as test,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'crm_bot_one_records') >= 4
        AND (SELECT COUNT(*) FROM pg_policies WHERE tablename = 'crm_bot_one_columns') >= 4
        THEN '✅ SUCCÈS'
        ELSE '❌ ÉCHEC'
    END as result

UNION ALL

SELECT 
    'Index créés' as test,
    CASE 
        WHEN (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'crm_bot_one_records') >= 3
        AND (SELECT COUNT(*) FROM pg_indexes WHERE tablename = 'crm_bot_one_columns') >= 2
        THEN '✅ SUCCÈS'
        ELSE '❌ ÉCHEC'
    END as result;
