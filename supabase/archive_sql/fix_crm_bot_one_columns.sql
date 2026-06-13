-- =====================================================
-- SCRIPT DE CORRECTION DES COLONNES CRM BOT ONE
-- =====================================================
-- À exécuter dans le SQL Editor de Supabase

-- 1. Vérifier d'abord l'état actuel des colonnes
SELECT 
    'Colonnes existantes' as info,
    COUNT(*) as count
FROM crm_bot_one_columns 
WHERE user_id = auth.uid();

-- 2. Vérifier les utilisateurs connectés
SELECT 
    'Utilisateur actuel' as info,
    auth.uid() as user_id,
    auth.email() as email;

-- 3. Supprimer les colonnes existantes pour l'utilisateur actuel (si nécessaire)
DELETE FROM crm_bot_one_columns 
WHERE user_id = auth.uid();

-- 4. Insérer les colonnes par défaut pour l'utilisateur actuel
INSERT INTO crm_bot_one_columns (
    user_id, 
    column_name, 
    column_type, 
    column_order, 
    is_required, 
    is_default, 
    default_value,
    options
) VALUES 
    (auth.uid(), 'Nom', 'text', 1, true, true, '', NULL),
    (auth.uid(), 'Email', 'email', 2, true, true, '', NULL),
    (auth.uid(), 'Téléphone', 'text', 3, false, true, '', NULL),
    (auth.uid(), 'Statut', 'select', 4, true, true, 'nouveau', '{"options": ["nouveau", "en_cours", "terminé", "annulé"]}'::jsonb);

-- 5. Vérifier que les colonnes ont été créées
SELECT 
    column_name,
    column_type,
    column_order,
    is_required,
    is_default,
    default_value,
    options
FROM crm_bot_one_columns 
WHERE user_id = auth.uid()
ORDER BY column_order;

-- 6. Test de création d'un enregistrement avec les colonnes par défaut
INSERT INTO crm_bot_one_records (
    user_id,
    data,
    status,
    tags
) VALUES (
    auth.uid(),
    '{
        "Nom": "Utilisateur Test",
        "Email": "test@propulseo.com",
        "Téléphone": "0123456789",
        "Statut": "nouveau"
    }'::jsonb,
    'active',
    ARRAY['test', 'demo', 'crm-bot-one']
);

-- 7. Vérifier l'enregistrement créé
SELECT 
    id,
    data,
    status,
    tags,
    created_at
FROM crm_bot_one_records 
WHERE user_id = auth.uid()
ORDER BY created_at DESC;

-- 8. Test final de vérification
SELECT 
    'Colonnes créées' as test,
    CASE 
        WHEN (SELECT COUNT(*) FROM crm_bot_one_columns WHERE user_id = auth.uid()) >= 4
        THEN '✅ SUCCÈS'
        ELSE '❌ ÉCHEC'
    END as result

UNION ALL

SELECT 
    'Enregistrement test' as test,
    CASE 
        WHEN (SELECT COUNT(*) FROM crm_bot_one_records WHERE user_id = auth.uid()) >= 1
        THEN '✅ SUCCÈS'
        ELSE '❌ ÉCHEC'
    END as result

UNION ALL

SELECT 
    'Données JSON valides' as test,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM crm_bot_one_records 
            WHERE user_id = auth.uid() 
            AND data ? 'Nom' 
            AND data ? 'Email'
        )
        THEN '✅ SUCCÈS'
        ELSE '❌ ÉCHEC'
    END as result;
