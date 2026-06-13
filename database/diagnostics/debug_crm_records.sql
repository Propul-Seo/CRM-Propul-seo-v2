-- =====================================================
-- DEBUG DES RECORDS CRM
-- =====================================================

-- Vérifier les records Bot One
SELECT 
  'BOT ONE RECORDS' as table_name,
  COUNT(*) as total_records
FROM crm_bot_one_records;

-- Afficher quelques records Bot One
SELECT 
  id,
  data->>'Nom de l\'entreprise' as company_name,
  data->>'Nom contact' as contact_name,
  data->>'Email' as email,
  status,
  created_at
FROM crm_bot_one_records
ORDER BY created_at DESC
LIMIT 5;

-- Vérifier les records BYW
SELECT 
  'BYW RECORDS' as table_name,
  COUNT(*) as total_records
FROM crm_byw_records;

-- Afficher quelques records BYW
SELECT 
  id,
  company_name,
  contact_name,
  email,
  client,
  created_at
FROM crm_byw_records
ORDER BY created_at DESC
LIMIT 5;

-- Vérifier les clients créés
SELECT 
  'CLIENTS' as table_name,
  COUNT(*) as total_clients
FROM clients;

-- Afficher quelques clients
SELECT 
  id,
  name,
  email,
  status,
  created_at
FROM clients
ORDER BY created_at DESC
LIMIT 5;
