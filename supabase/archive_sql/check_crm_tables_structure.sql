-- =====================================================
-- VÉRIFICATION DE LA STRUCTURE DES TABLES CRM
-- =====================================================

-- Vérifier la structure de crm_bot_one_records
SELECT 
  'crm_bot_one_records' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'crm_bot_one_records'
ORDER BY ordinal_position;

-- Vérifier la structure de crm_byw_records
SELECT 
  'crm_byw_records' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'crm_byw_records'
ORDER BY ordinal_position;

-- Vérifier la structure de clients
SELECT 
  'clients' as table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns 
WHERE table_name = 'clients'
ORDER BY ordinal_position;
