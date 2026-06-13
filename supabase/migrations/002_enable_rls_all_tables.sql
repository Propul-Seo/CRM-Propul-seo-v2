-- =====================================================
-- ACTIVER RLS SUR TOUTES LES TABLES - CRM PROPUL'SEO
-- =====================================================
-- ATTENTION: Executer APRES avoir verifie les politiques
-- Ce script active RLS - sans politique, AUCUN acces!
-- =====================================================

-- CONTACTS
-- =====================================================
ALTER TABLE IF EXISTS contacts ENABLE ROW LEVEL SECURITY;

-- Politique SELECT: Voir ses propres contacts ou ceux assignes
DROP POLICY IF EXISTS "contacts_select_own" ON contacts;
CREATE POLICY "contacts_select_own" ON contacts
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR auth.uid() = assigned_to
        OR EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'manager')
        )
    );

-- Politique INSERT: Creer ses propres contacts
DROP POLICY IF EXISTS "contacts_insert_own" ON contacts;
CREATE POLICY "contacts_insert_own" ON contacts
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Politique UPDATE: Modifier ses contacts ou ceux assignes
DROP POLICY IF EXISTS "contacts_update_own" ON contacts;
CREATE POLICY "contacts_update_own" ON contacts
    FOR UPDATE
    USING (
        auth.uid() = user_id
        OR auth.uid() = assigned_to
        OR EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'manager')
        )
    )
    WITH CHECK (
        auth.uid() = user_id
        OR auth.uid() = assigned_to
        OR EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'manager')
        )
    );

-- Politique DELETE: Supprimer ses contacts (admin/manager pour tous)
DROP POLICY IF EXISTS "contacts_delete_own" ON contacts;
CREATE POLICY "contacts_delete_own" ON contacts
    FOR DELETE
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'manager')
        )
    );


-- ACTIVITIES
-- =====================================================
ALTER TABLE IF EXISTS activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "activities_select_own" ON activities;
CREATE POLICY "activities_select_own" ON activities
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'manager')
        )
    );

DROP POLICY IF EXISTS "activities_insert_own" ON activities;
CREATE POLICY "activities_insert_own" ON activities
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "activities_update_own" ON activities;
CREATE POLICY "activities_update_own" ON activities
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "activities_delete_own" ON activities;
CREATE POLICY "activities_delete_own" ON activities
    FOR DELETE
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );


-- PROJECTS
-- =====================================================
ALTER TABLE IF EXISTS projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select_team" ON projects;
CREATE POLICY "projects_select_team" ON projects
    FOR SELECT
    USING (
        auth.uid() = user_id
        OR auth.uid() = ANY(team_ids)
        OR EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'manager')
        )
    );

DROP POLICY IF EXISTS "projects_insert_own" ON projects;
CREATE POLICY "projects_insert_own" ON projects
    FOR INSERT
    WITH CHECK (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'manager')
        )
    );

DROP POLICY IF EXISTS "projects_update_team" ON projects;
CREATE POLICY "projects_update_team" ON projects
    FOR UPDATE
    USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role IN ('admin', 'manager')
        )
    );

DROP POLICY IF EXISTS "projects_delete_admin" ON projects;
CREATE POLICY "projects_delete_admin" ON projects
    FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );


-- USERS / USER_PROFILES
-- =====================================================
ALTER TABLE IF EXISTS users ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS user_profiles ENABLE ROW LEVEL SECURITY;

-- Users: Lecture pour tous les authentifies (annuaire)
DROP POLICY IF EXISTS "users_select_authenticated" ON users;
CREATE POLICY "users_select_authenticated" ON users
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

-- Users: Modification de son propre profil uniquement
DROP POLICY IF EXISTS "users_update_own" ON users;
CREATE POLICY "users_update_own" ON users
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- User profiles: memes regles
DROP POLICY IF EXISTS "profiles_select_authenticated" ON user_profiles;
CREATE POLICY "profiles_select_authenticated" ON user_profiles
    FOR SELECT
    USING (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "profiles_update_own" ON user_profiles;
CREATE POLICY "profiles_update_own" ON user_profiles
    FOR UPDATE
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);


-- MESSAGES (si table existe)
-- =====================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'messages') THEN
        ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

        -- Politique: Voir les messages de ses channels
        DROP POLICY IF EXISTS "messages_select_channel_member" ON messages;
        CREATE POLICY "messages_select_channel_member" ON messages
            FOR SELECT
            USING (
                auth.uid() = user_id
                OR EXISTS (
                    SELECT 1 FROM channel_members
                    WHERE channel_members.channel_id = messages.channel_id
                    AND channel_members.user_id = auth.uid()
                )
            );
    END IF;
END $$;


-- TRANSACTIONS (si table existe)
-- =====================================================
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'transactions') THEN
        ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

        -- Seuls les admins peuvent voir les transactions
        DROP POLICY IF EXISTS "transactions_admin_only" ON transactions;
        CREATE POLICY "transactions_admin_only" ON transactions
            FOR ALL
            USING (
                EXISTS (
                    SELECT 1 FROM users
                    WHERE users.id = auth.uid()
                    AND users.role = 'admin'
                )
            );
    END IF;
END $$;


-- =====================================================
-- VERIFICATION FINALE
-- =====================================================
SELECT
    tablename,
    COUNT(*) as policies_count
FROM pg_policies
WHERE schemaname = 'public'
GROUP BY tablename
ORDER BY tablename;
