-- =====================================================
-- CORRECTION DES CLÉS CRM BOT ONE
-- =====================================================

-- 1. Supprimer les anciennes colonnes
DELETE FROM crm_bot_one_columns;

-- 2. Créer les colonnes avec des clés simples (sans apostrophe)
INSERT INTO crm_bot_one_columns (user_id, column_name, column_type, column_order, is_required, is_default, default_value, options)
SELECT 
    u.id,
    column_name,
    column_type,
    column_order,
    is_required,
    true,
    default_value,
    options
FROM auth.users u
CROSS JOIN (VALUES 
    ('Nom entreprise', 'text', 1, true, '', NULL),
    ('Nom contact', 'text', 2, true, '', NULL),
    ('Email', 'email', 3, true, '', NULL),
    ('Telephone', 'text', 4, false, '', NULL),
    ('Site web', 'url', 5, false, '', NULL),
    ('Type contact', 'select', 6, true, 'entreprise', '{"options": ["particulier", "entreprise", "agence digital", "autre"]}'::jsonb),
    ('Statut', 'select', 7, true, 'prospect', '{"options": ["prospect", "en discussion", "Demo planifié", "abonné", "perdu"]}'::jsonb)
) AS cols(column_name, column_type, column_order, is_required, default_value, options)
ON CONFLICT (user_id, column_name) DO NOTHING;

-- 3. Supprimer les anciens enregistrements
DELETE FROM crm_bot_one_records;

-- 4. Créer les leads de test avec les nouvelles clés
WITH first_user AS (
    SELECT id FROM auth.users LIMIT 1
)
INSERT INTO crm_bot_one_records (user_id, data, status, tags)
SELECT 
    id,
    '{
        "Nom entreprise": "PropulSEO",
        "Nom contact": "Jean Dupont",
        "Email": "jean@propulseo.com",
        "Telephone": "0123456789",
        "Site web": "https://propulseo.com",
        "Type contact": "entreprise",
        "Statut": "prospect"
    }'::jsonb,
    'prospect',
    ARRAY['test', 'demo']
FROM first_user;

-- 5. Lead en discussion
WITH first_user AS (
    SELECT id FROM auth.users LIMIT 1
)
INSERT INTO crm_bot_one_records (user_id, data, status, tags)
SELECT 
    id,
    '{
        "Nom entreprise": "Digital Agency Pro",
        "Nom contact": "Marie Martin",
        "Email": "marie@digitalagency.com",
        "Telephone": "0987654321",
        "Site web": "https://digitalagency.com",
        "Type contact": "agence digital",
        "Statut": "en discussion"
    }'::jsonb,
    'en discussion',
    ARRAY['hot', 'agence']
FROM first_user;

-- 6. Lead avec demo planifié
WITH first_user AS (
    SELECT id FROM auth.users LIMIT 1
)
INSERT INTO crm_bot_one_records (user_id, data, status, tags)
SELECT 
    id,
    '{
        "Nom entreprise": "Restaurant Le Bon Goût",
        "Nom contact": "Pierre Durand",
        "Email": "pierre@restaurant.com",
        "Telephone": "0555123456",
        "Site web": "https://restaurant-bongout.com",
        "Type contact": "entreprise",
        "Statut": "Demo planifié"
    }'::jsonb,
    'Demo planifié',
    ARRAY['demo', 'restaurant']
FROM first_user;

-- 7. Lead abonné
WITH first_user AS (
    SELECT id FROM auth.users LIMIT 1
)
INSERT INTO crm_bot_one_records (user_id, data, status, tags)
SELECT 
    id,
    '{
        "Nom entreprise": "Boulangerie du Coin",
        "Nom contact": "Sophie Leroy",
        "Email": "sophie@boulangerie.com",
        "Telephone": "0145678901",
        "Site web": "https://boulangerie-du-coin.fr",
        "Type contact": "entreprise",
        "Statut": "abonné"
    }'::jsonb,
    'abonné',
    ARRAY['client', 'boulangerie']
FROM first_user;

-- 8. Vérifier le résultat
SELECT 
    'CRM Bot One configuré' as test,
    CASE 
        WHEN (SELECT COUNT(*) FROM crm_bot_one_columns) >= 7
        AND (SELECT COUNT(*) FROM crm_bot_one_records) >= 4
        THEN '✅ SUCCÈS - Layout simple prêt !'
        ELSE '❌ ÉCHEC'
    END as result;

-- 9. Afficher les leads créés
SELECT 
    data->>'Nom entreprise' as entreprise,
    data->>'Nom contact' as contact,
    data->>'Statut' as statut,
    data->>'Type contact' as type_contact
FROM crm_bot_one_records
ORDER BY created_at DESC;
