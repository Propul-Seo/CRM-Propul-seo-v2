-- Add revenue categorization columns to accounting_entries
ALTER TABLE accounting_entries
  ADD COLUMN IF NOT EXISTS revenue_category text,
  ADD COLUMN IF NOT EXISTS revenue_sous_categorie text;

-- Add CHECK constraint for revenue_category values
ALTER TABLE accounting_entries
  ADD CONSTRAINT chk_revenue_category
  CHECK (revenue_category IS NULL OR revenue_category IN ('site_internet', 'erp', 'communication'));

-- Add CHECK constraint for revenue_sous_categorie (only valid when category is 'communication')
ALTER TABLE accounting_entries
  ADD CONSTRAINT chk_revenue_sous_categorie
  CHECK (
    revenue_sous_categorie IS NULL
    OR (revenue_category = 'communication' AND revenue_sous_categorie IN ('chatbot', 'cm', 'newsletter', 'autre'))
  );

-- Backfill existing revenues with 'site_internet' by default
UPDATE accounting_entries
SET revenue_category = 'site_internet'
WHERE type = 'revenue' AND revenue_category IS NULL;

-- Exception: Rebecca Chatbot -> communication + chatbot
UPDATE accounting_entries
SET revenue_category = 'communication', revenue_sous_categorie = 'chatbot'
WHERE description = 'Rebecca Chatbot' AND type = 'revenue';
