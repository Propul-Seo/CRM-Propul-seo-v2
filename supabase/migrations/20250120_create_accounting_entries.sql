-- Migration pour créer la table accounting_entries
-- Date: 2025-01-20

-- Vérifier si la table existe déjà
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'accounting_entries') THEN
        -- Créer la table accounting_entries
        CREATE TABLE accounting_entries (
            id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
            type TEXT NOT NULL CHECK (type IN ('revenue', 'expense')),
            description TEXT NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            category TEXT NOT NULL,
            client_id UUID REFERENCES clients(id) ON DELETE SET NULL,
            entry_date DATE NOT NULL,
            is_recurring BOOLEAN DEFAULT false,
            created_by UUID REFERENCES user_profiles(id) NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- Créer les index pour optimiser les requêtes
        CREATE INDEX idx_accounting_entries_user_id ON accounting_entries(user_id);
        CREATE INDEX idx_accounting_entries_type ON accounting_entries(type);
        CREATE INDEX idx_accounting_entries_entry_date ON accounting_entries(entry_date);
        CREATE INDEX idx_accounting_entries_created_by ON accounting_entries(created_by);

        -- Activer Row Level Security
        ALTER TABLE accounting_entries ENABLE ROW LEVEL SECURITY;

        -- Créer les politiques RLS
        CREATE POLICY "Users can manage own accounting entries"
        ON accounting_entries
        FOR ALL
        TO authenticated
        USING (auth.uid() = user_id);

        -- Créer le trigger pour updated_at
        CREATE TRIGGER update_accounting_entries_updated_at
        BEFORE UPDATE ON accounting_entries
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();

        RAISE NOTICE 'Table accounting_entries créée avec succès';
    ELSE
        RAISE NOTICE 'Table accounting_entries existe déjà';
    END IF;
END $$; 