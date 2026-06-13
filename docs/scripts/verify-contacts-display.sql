-- Vérifier que les contacts sont bien présents et ont les bons statuts
-- Pour diagnostiquer pourquoi les leads ne s'affichent plus

-- 1. Vérifier la table des contacts
SELECT 
    'Contacts table' as info,
    COUNT(*) as total_contacts
FROM contacts;

-- 2. Vérifier les statuts des contacts
SELECT 
    status,
    COUNT(*) as count
FROM contacts 
GROUP BY status 
ORDER BY count DESC;

-- 3. Vérifier la correspondance avec les colonnes CRM
SELECT 
    'Mapping check' as info,
    c.title as column_title,
    c.id as column_id,
    COUNT(cont.status) as contacts_count
FROM crm_columns c
LEFT JOIN contacts cont ON (
    CASE c.title
        WHEN 'Prospects' THEN cont.status = 'prospect'
        WHEN 'Présentation Envoyée' THEN cont.status = 'presentation_envoyee'
        WHEN 'Meeting Booké' THEN cont.status = 'meeting_booke'
        WHEN 'Offre Envoyée' THEN cont.status = 'offre_envoyee'
        WHEN 'En Attente' THEN cont.status = 'en_attente'
        WHEN 'Signés' THEN cont.status = 'signe'
        ELSE false
    END
)
WHERE c.is_active = true
GROUP BY c.id, c.title, c.position
ORDER BY c.position;

-- 4. Vérifier quelques contacts d'exemple
SELECT 
    id,
    name,
    company,
    status,
    created_at
FROM contacts 
LIMIT 5;

-- 5. Vérifier que les colonnes CRM sont bien actives
SELECT 
    id,
    title,
    position,
    is_active
FROM crm_columns 
WHERE is_active = true 
ORDER BY position;
