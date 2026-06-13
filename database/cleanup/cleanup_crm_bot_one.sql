-- =====================================================
-- NETTOYAGE CRM BOT ONE
-- =====================================================

-- 1. Supprimer les enregistrements avec des valeurs null
DELETE FROM crm_bot_one_records 
WHERE data->>'Nom de l''entreprise' IS NULL 
   OR data->>'Nom contact' IS NULL;

-- 2. Vérifier les enregistrements restants
SELECT 
    'Enregistrements nettoyés' as info,
    COUNT(*) as count
FROM crm_bot_one_records;

-- 3. Afficher les leads valides
SELECT 
    data->>'Nom de l''entreprise' as entreprise,
    data->>'Nom contact' as contact,
    data->>'Statut' as statut,
    data->>'Type de contact' as type_contact,
    data->>'Email' as email
FROM crm_bot_one_records
ORDER BY created_at DESC;

-- 4. Créer un lead supplémentaire pour tester
WITH first_user AS (
    SELECT id FROM auth.users LIMIT 1
)
INSERT INTO crm_bot_one_records (user_id, data, status, tags)
SELECT 
    id,
    '{
        "Nom de l''entreprise": "Boulangerie du Coin",
        "Nom contact": "Sophie Leroy",
        "Email": "sophie@boulangerie.com",
        "Téléphone": "0145678901",
        "Site web": "https://boulangerie-du-coin.fr",
        "Type de contact": "entreprise",
        "Statut": "abonné"
    }'::jsonb,
    'abonné',
    ARRAY['client', 'boulangerie']
FROM first_user;

-- 5. Test final
SELECT 
    'CRM Bot One prêt' as test,
    CASE 
        WHEN (SELECT COUNT(*) FROM crm_bot_one_records) >= 4
        THEN '✅ SUCCÈS - 4 leads valides créés !'
        ELSE '❌ ÉCHEC'
    END as result;
