-- Script pour ajouter la colonne assigned_to à la table contacts
-- Cette colonne permettra d'assigner des leads à des utilisateurs spécifiques

-- 1. Vérifier si la colonne existe déjà
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'contacts' 
        AND column_name = 'assigned_to'
    ) THEN
        -- 2. Ajouter la colonne assigned_to
        ALTER TABLE contacts 
        ADD COLUMN assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL;
        
        -- 3. Ajouter un commentaire pour documenter la colonne
        COMMENT ON COLUMN contacts.assigned_to IS 'ID de l''utilisateur assigné à ce contact/lead';
        
        RAISE NOTICE 'Colonne assigned_to ajoutée avec succès à la table contacts';
    ELSE
        RAISE NOTICE 'La colonne assigned_to existe déjà dans la table contacts';
    END IF;
END $$;

-- 4. Vérifier la structure mise à jour
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'contacts' 
AND column_name IN ('id', 'name', 'company', 'email', 'phone', 'status', 'assigned_to', 'created_at', 'updated_at')
ORDER BY ordinal_position;

-- 5. Vérifier les contraintes de clé étrangère
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
    ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
    ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY' 
AND tc.table_name = 'contacts'
AND kcu.column_name = 'assigned_to';

-- 6. Mettre à jour les politiques RLS si nécessaire
-- Vérifier les politiques existantes
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
WHERE tablename = 'contacts';

-- 7. Ajouter une politique RLS pour assigned_to si elle n'existe pas
-- Cette politique permet aux utilisateurs de voir les contacts qui leur sont assignés
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'contacts' 
        AND policyname = 'users_can_see_assigned_contacts'
    ) THEN
        CREATE POLICY "users_can_see_assigned_contacts" ON contacts
        FOR SELECT USING (
            assigned_to = auth.uid() OR 
            assigned_to IS NULL OR
            auth.uid() IN (
                SELECT id FROM auth.users WHERE role = 'admin'
            )
        );
        
        RAISE NOTICE 'Politique RLS "users_can_see_assigned_contacts" créée avec succès';
    ELSE
        RAISE NOTICE 'La politique RLS "users_can_see_assigned_contacts" existe déjà';
    END IF;
END $$;

-- 8. Vérifier que tout fonctionne
-- Tester avec un utilisateur connecté
-- (Cette partie nécessite d'être exécutée avec un utilisateur authentifié)
SELECT 
    'Test de la colonne assigned_to' as test,
    COUNT(*) as total_contacts,
    COUNT(assigned_to) as contacts_assignes,
    COUNT(*) FILTER (WHERE assigned_to IS NULL) as contacts_non_assignes
FROM contacts;
