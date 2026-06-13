-- First drop the existing view if it exists
DROP VIEW IF EXISTS dashboard_metrics;

-- Create the dashboard_metrics table
CREATE TABLE IF NOT EXISTS dashboard_metrics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  month DATE NOT NULL,
  total_revenue INTEGER NOT NULL DEFAULT 0,
  total_expenses INTEGER NOT NULL DEFAULT 0,
  net_result INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE dashboard_metrics ENABLE ROW LEVEL SECURITY;

-- Create policy for users to manage their own metrics
CREATE POLICY "Users can manage dashboard metrics"
ON dashboard_metrics
FOR ALL
TO authenticated
USING (auth.uid() IS NOT NULL);

-- Create unique constraint on month to ensure only one record per month
ALTER TABLE dashboard_metrics ADD CONSTRAINT dashboard_metrics_month_key UNIQUE (month);