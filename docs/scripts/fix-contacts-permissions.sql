-- Script pour corriger les permissions sur la table contacts
-- Ce script crée les politiques RLS nécessaires pour que les utilisateurs authentifiés puissent accéder aux contacts

-- 1. Activer RLS sur la table contacts si ce n'est pas déjà fait
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- 2. Supprimer les anciennes politiques s'il y en a
DROP POLICY IF EXISTS "users_can_see_all_contacts" ON contacts;
DROP POLICY IF EXISTS "users_can_insert_contacts" ON contacts;
DROP POLICY IF EXISTS "users_can_update_contacts" ON contacts;
DROP POLICY IF EXISTS "users_can_delete_contacts" ON contacts;
DROP POLICY IF EXISTS "users_can_see_assigned_contacts" ON contacts;

-- 3. Créer la politique pour voir tous les contacts
CREATE POLICY "users_can_see_all_contacts" ON contacts
    FOR SELECT
    TO authenticated
    USING (true);

-- 4. Créer la politique pour insérer des contacts
CREATE POLICY "users_can_insert_contacts" ON contacts
    FOR INSERT
    TO authenticated
    WITH CHECK (true);

-- 5. Créer la politique pour mettre à jour les contacts
CREATE POLICY "users_can_update_contacts" ON contacts
    FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

-- 6. Créer la politique pour supprimer les contacts
CREATE POLICY "users_can_delete_contacts" ON contacts
    FOR DELETE
    TO authenticated
    USING (true);

-- 7. Vérifier que les politiques ont été créées
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE tablename = 'contacts'
ORDER BY policyname;

-- 8. Tester les permissions en tant qu'utilisateur authentifié
-- (Cette partie sera testée depuis l'application)

-- 9. Vérifier que RLS est activé
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM pg_tables 
WHERE tablename = 'contacts';

-- 10. Vérifier les permissions finales
SELECT 
    grantee,
    privilege_type,
    is_grantable
FROM information_schema.role_table_grants 
WHERE table_name = 'contacts'
ORDER BY grantee, privilege_type;
