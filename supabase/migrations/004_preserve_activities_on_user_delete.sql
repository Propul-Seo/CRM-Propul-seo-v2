-- =====================================================
-- PRESERVATION DES ACTIVITES APRES SUPPRESSION UTILISATEUR
-- =====================================================
-- Modifie les contraintes de clés étrangères pour que les activités
-- restent visibles même après suppression d'un utilisateur
-- =====================================================

-- 1. USER_ACTIVITIES - Passer de CASCADE à SET NULL
ALTER TABLE user_activities
DROP CONSTRAINT IF EXISTS user_activities_user_id_fkey;

ALTER TABLE user_activities
ADD CONSTRAINT user_activities_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 2. CONTACT_ACTIVITIES - Passer de CASCADE à SET NULL pour user_id
ALTER TABLE contact_activities
DROP CONSTRAINT IF EXISTS contact_activities_user_id_fkey;

ALTER TABLE contact_activities
ADD CONSTRAINT contact_activities_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 3. ACTIVITY_LOG - Passer de CASCADE à SET NULL
ALTER TABLE activity_log
DROP CONSTRAINT IF EXISTS activity_log_user_id_fkey;

ALTER TABLE activity_log
ADD CONSTRAINT activity_log_user_id_fkey
FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL;

-- 4. LEAD_NOTES - Déjà en NO ACTION, mais s'assurer que created_by peut être NULL
-- (La contrainte pointe vers user_profiles, pas users, donc on laisse tel quel)

-- 5. Adapter les politiques RLS pour permettre de voir les activités
-- même si user_id est NULL (utilisateur supprimé)

-- USER_ACTIVITIES - Permettre de voir toutes les activités (même avec user_id NULL)
DROP POLICY IF EXISTS "user_activities_select_all_with_deleted_users" ON user_activities;
CREATE POLICY "user_activities_select_all_with_deleted_users" ON user_activities
    FOR SELECT USING (
        auth.uid() = user_id 
        OR user_id IS NULL  -- Activités d'utilisateurs supprimés
        OR is_manager_or_admin()
    );

-- CONTACT_ACTIVITIES - Permettre de voir toutes les activités (même avec user_id NULL)
-- Note: contact_activities a déjà des politiques, on les adapte
DROP POLICY IF EXISTS "contact_activities_select_with_deleted_users" ON contact_activities;
CREATE POLICY "contact_activities_select_with_deleted_users" ON contact_activities
    FOR SELECT USING (
        auth.uid() = user_id
        OR user_id IS NULL  -- Activités d'utilisateurs supprimés
        OR EXISTS (
            SELECT 1 FROM contacts
            WHERE contacts.id = contact_activities.contact_id
            AND (contacts.user_id = auth.uid() OR contacts.assigned_to = auth.uid())
        )
        OR is_manager_or_admin()
    );

-- ACTIVITY_LOG - Permettre de voir tous les logs (même avec user_id NULL)
DROP POLICY IF EXISTS "activity_log_select_all_with_deleted_users" ON activity_log;
CREATE POLICY "activity_log_select_all_with_deleted_users" ON activity_log
    FOR SELECT USING (
        auth.uid() = user_id
        OR user_id IS NULL  -- Logs d'utilisateurs supprimés
        OR is_manager_or_admin()
    );
