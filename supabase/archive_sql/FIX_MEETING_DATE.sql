-- =====================================================
-- CORRECTION DE LA DATE DE RDV
-- =====================================================

-- 1. MODIFIER LA COLONNE meeting_date POUR ACCEPTER NULL
ALTER TABLE commercial_meetings ALTER COLUMN meeting_date DROP NOT NULL;

-- 2. OU ALORS INSÉRER AVEC UNE DATE
INSERT INTO commercial_meetings (
  calleur_id,
  lead_name,
  lead_phone,
  lead_email,
  meeting_date,
  meeting_duration,
  meeting_status,
  meeting_result,
  notes
)
VALUES (
  '470c709c-abce-48c8-b8b3-320cd98a5ed5'::UUID,
  'Test Lead 2',
  '+33123456789',
  'test2@lead.com',
  NOW(),
  60,
  'scheduled',
  'follow_up_needed',
  'Test de création de RDV avec date'
);

-- 3. VÉRIFIER QUE LE RDV A ÉTÉ CRÉÉ
SELECT 
  id,
  calleur_id,
  lead_name,
  lead_phone,
  lead_email,
  meeting_date,
  meeting_status,
  created_at
FROM commercial_meetings 
WHERE calleur_id = '470c709c-abce-48c8-b8b3-320cd98a5ed5'::UUID
ORDER BY created_at DESC;

-- 4. TESTER LA FONCTION
SELECT 'Test fonction:' as info;
SELECT * FROM get_commercial_stats('470c709c-abce-48c8-b8b3-320cd98a5ed5'::UUID);

-- 5. COMPTER LES RDV
SELECT 'Total RDV:' as info, COUNT(*) as count FROM commercial_meetings;
