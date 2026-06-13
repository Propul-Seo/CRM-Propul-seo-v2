-- ============================================================
-- Fix : apostrophes doubles ('') stockées par la migration
-- 20260425_rewrite_procedures_pedagogique.sql
--
-- Cause : dans les blocs $jsonb$...$jsonb$ (dollar-quoting), les
-- apostrophes simples n'ont pas besoin d'être échappées. Or le
-- texte source les a doublées comme dans une string SQL classique.
-- Résultat : ''adresse, l''essai, etc. en base.
--
-- On remplace `''` par `'` dans summary, content_text et content.
-- ============================================================

-- 1. summary
UPDATE public.procedures
SET summary = REPLACE(summary, '''''', '''')
WHERE summary LIKE '%''''%';

-- 2. content_text (FTS)
UPDATE public.procedures
SET content_text = REPLACE(content_text, '''''', '''')
WHERE content_text LIKE '%''''%';

-- 3. content (JSONB) — sérialisation/replace/parse.
-- Aucun texte légitime ne contient `''` dans les fiches actuelles.
UPDATE public.procedures
SET content = REPLACE(content::text, '''''', '''')::jsonb
WHERE content::text LIKE '%''''%';

-- 4. Idem pour les revisions historiques (cohérence)
UPDATE public.procedure_revisions
SET content_text = REPLACE(content_text, '''''', '''')
WHERE content_text LIKE '%''''%';

UPDATE public.procedure_revisions
SET summary = REPLACE(summary, '''''', '''')
WHERE summary LIKE '%''''%';

UPDATE public.procedure_revisions
SET content = REPLACE(content::text, '''''', '''')::jsonb
WHERE content::text LIKE '%''''%';
