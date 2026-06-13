    -- Diagnostic simple de la table contacts
    -- Sans boucles complexes pour éviter les erreurs de syntaxe

    -- 1. Vérifier si la table contacts existe
    SELECT 
        CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts') 
            THEN 'Table contacts existe' 
            ELSE 'Table contacts N''EXISTE PAS' 
        END as contacts_table_status;

    -- 2. Compter le nombre total de contacts
    SELECT 
        CASE 
            WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contacts') 
            THEN (SELECT COUNT(*) FROM contacts)
            ELSE 0 
        END as total_contacts;

    -- 3. Lister les colonnes de la table contacts
    SELECT 
        column_name, 
        data_type, 
        is_nullable
    FROM information_schema.columns 
    WHERE table_name = 'contacts'
    ORDER BY ordinal_position;

    -- 4. Lister les statuts des contacts avec leurs compteurs
    SELECT 
        status, 
        COUNT(*) as count
    FROM contacts 
    GROUP BY status 
    ORDER BY count DESC;

    -- 5. Vérifier les permissions sur la table contacts
    SELECT 
        grantee, 
        privilege_type, 
        is_grantable
    FROM information_schema.role_table_grants 
    WHERE table_name = 'contacts';

    -- 6. Vérifier que crm_columns fonctionne toujours
    SELECT 
        'crm_columns status' as info,
        COUNT(*) as total_columns,
        COUNT(CASE WHEN is_active = true THEN 1 END) as active_columns
    FROM crm_columns;
