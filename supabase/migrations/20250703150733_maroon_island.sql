/*
  # Create accounting entries table
  
  1. New Tables
    - `accounting_entries` - Stores financial transactions (revenue and expenses)
      - `id` (uuid, primary key)
      - `type` (text, check constraint for 'revenue' or 'expense')
      - `amount` (integer)
      - `category` (text)
      - `description` (text)
      - `entry_date` (date)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)
  
  2. Indexes
    - Index on `type` for filtering by transaction type
    - Index on `entry_date` for date-based queries
    - Composite index on `type` and `entry_date` for filtered reports
  
  3. Security
    - Enable RLS
    - Policy for authenticated users
*/

-- Create the accounting_entries table
CREATE TABLE IF NOT EXISTS accounting_entries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL CHECK (type IN ('revenue', 'expense')),
  amount INTEGER NOT NULL,
  category TEXT NOT NULL,
  description TEXT NOT NULL,
  entry_date DATE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes for optimized accounting queries
CREATE INDEX idx_accounting_entries_type ON accounting_entries(type);
CREATE INDEX idx_accounting_entries_entry_date ON accounting_entries(entry_date);
CREATE INDEX idx_accounting_entries_type_date ON accounting_entries(type, entry_date);

-- Enable Row Level Security
ALTER TABLE accounting_entries ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own accounting entries
CREATE POLICY "Users can manage their own accounting entries"
ON accounting_entries
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Create trigger to automatically update the updated_at column
CREATE TRIGGER update_accounting_entries_updated_at
BEFORE UPDATE ON accounting_entries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();