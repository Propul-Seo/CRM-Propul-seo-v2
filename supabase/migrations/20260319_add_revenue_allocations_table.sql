-- Table to split a single revenue entry across multiple categories
CREATE TABLE revenue_allocations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  entry_id uuid NOT NULL REFERENCES accounting_entries(id) ON DELETE CASCADE,
  revenue_category text NOT NULL CHECK (revenue_category IN ('site_internet', 'erp', 'communication')),
  revenue_sous_categorie text CHECK (
    revenue_sous_categorie IS NULL
    OR (revenue_category = 'communication' AND revenue_sous_categorie IN ('chatbot', 'cm', 'newsletter', 'autre'))
  ),
  amount numeric(12,2) NOT NULL CHECK (amount > 0),
  created_at timestamptz DEFAULT now()
);

-- Index for fast lookups by entry
CREATE INDEX idx_revenue_allocations_entry_id ON revenue_allocations(entry_id);

-- Backfill: one allocation per existing revenue that has a category
INSERT INTO revenue_allocations (entry_id, revenue_category, revenue_sous_categorie, amount)
SELECT id, revenue_category, revenue_sous_categorie, amount
FROM accounting_entries
WHERE type = 'revenue' AND revenue_category IS NOT NULL;

-- Enable RLS
ALTER TABLE revenue_allocations ENABLE ROW LEVEL SECURITY;

-- Allow all for authenticated users
CREATE POLICY "Allow all for authenticated" ON revenue_allocations
  FOR ALL USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE revenue_allocations;
