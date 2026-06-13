-- Migration pour corriger les permissions et politiques RLS
-- Résout les erreurs 404 sur auth.users et les problèmes de suppression

-- 1. Activer RLS sur crm_columns si pas déjà fait
ALTER TABLE crm_columns ENABLE ROW LEVEL SECURITY;

-- 2. Créer une politique pour permettre la lecture des colonnes actives
DROP POLICY IF EXISTS "Allow read active columns" ON crm_columns;
CREATE POLICY "Allow read active columns" ON crm_columns
    FOR SELECT USING (is_active = true);

-- 3. Créer une politique pour permettre la modification des colonnes (admin)
DROP POLICY IF EXISTS "Allow update columns" ON crm_columns;
CREATE POLICY "Allow update columns" ON crm_columns
    FOR UPDATE USING (true)
    WITH CHECK (true);

-- 4. Créer une politique pour permettre l'insertion de nouvelles colonnes
DROP POLICY IF EXISTS "Allow insert columns" ON crm_columns;
CREATE POLICY "Allow insert columns" ON crm_columns
    FOR INSERT WITH CHECK (true);

-- 5. Activer RLS sur contacts si pas déjà fait
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;

-- 6. Créer une politique pour permettre la lecture des contacts
DROP POLICY IF EXISTS "Allow read contacts" ON contacts;
CREATE POLICY "Allow read contacts" ON contacts
    FOR SELECT USING (true);

-- 7. Créer une politique pour permettre la modification des contacts
DROP POLICY IF EXISTS "Allow update contacts" ON contacts;
CREATE POLICY "Allow update contacts" ON contacts
    FOR UPDATE USING (true)
    WITH CHECK (true);

-- 8. Créer une politique pour permettre l'insertion de contacts
DROP POLICY IF EXISTS "Allow insert contacts" ON contacts;
CREATE POLICY "Allow insert contacts" ON contacts
    FOR INSERT WITH CHECK (true);

-- 9. Donner les permissions nécessaires aux rôles
GRANT ALL ON crm_columns TO authenticated;
GRANT ALL ON contacts TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;

-- 10. Vérifier que les politiques sont créées
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd
FROM pg_policies 
WHERE tablename IN ('crm_columns', 'contacts')
ORDER BY tablename, policyname;

-- 11. Tester que les permissions fonctionnent
SELECT 
    'Permissions test' as info,
    COUNT(*) as crm_columns_count
FROM crm_columns 
WHERE is_active = true;

SELECT 
    'Permissions test' as info,
    COUNT(*) as contacts_count
FROM contacts 
LIMIT 1;
