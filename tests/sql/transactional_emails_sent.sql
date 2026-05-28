-- Tests sanity migration 264 — à exécuter via mcp__claude_ai_Supabase__execute_sql
-- ou psql en mode développement.

-- T1 : table existe
SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'propulspace' AND table_name = 'transactional_emails_sent'
) AS t1_table_exists;
-- Attendu : t (true)

-- T2 : 3 indexes + 1 trigger
SELECT count(*) AS t2_indexes FROM pg_indexes
WHERE schemaname = 'propulspace' AND tablename = 'transactional_emails_sent';
-- Attendu : 4 (PK + 3 secondaires)

SELECT count(*) AS t2_triggers FROM pg_trigger
WHERE tgrelid = 'propulspace.transactional_emails_sent'::regclass AND NOT tgisinternal;
-- Attendu : 1 (updated_at)

-- T3 : RLS activée + 1 policy
SELECT relrowsecurity AS t3_rls FROM pg_class
WHERE oid = 'propulspace.transactional_emails_sent'::regclass;
-- Attendu : t

SELECT count(*) AS t3_policies FROM pg_policies
WHERE schemaname = 'propulspace' AND tablename = 'transactional_emails_sent';
-- Attendu : 1

-- T4 : contrainte UNIQUE empêche les doublons
INSERT INTO propulspace.transactional_emails_sent
  (template_key, dedupe_key, recipient_email, status)
VALUES ('test', 'dedupe-1', 'test@example.com', 'pending')
RETURNING id;

DO $$
DECLARE conflict_caught BOOLEAN := false;
BEGIN
  BEGIN
    INSERT INTO propulspace.transactional_emails_sent
      (template_key, dedupe_key, recipient_email, status)
    VALUES ('test', 'dedupe-1', 'autre@example.com', 'pending');
  EXCEPTION WHEN unique_violation THEN
    conflict_caught := true;
  END;
  RAISE NOTICE 't4_unique_constraint_works: %', conflict_caught;
END $$;
-- Attendu dans NOTICE : true

-- Cleanup
DELETE FROM propulspace.transactional_emails_sent WHERE template_key = 'test';
