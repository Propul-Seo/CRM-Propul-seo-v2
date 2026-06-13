-- Migration: Add position column to projects table for ordering within columns
-- This enables drag & drop reordering within Kanban columns

-- Add position column with default value
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS position INTEGER DEFAULT 0;

-- Initialize positions based on creation date (oldest first)
WITH ranked AS (
  SELECT
    id,
    ROW_NUMBER() OVER (PARTITION BY status ORDER BY created_at) - 1 as new_position
  FROM projects
)
UPDATE projects
SET position = ranked.new_position
FROM ranked
WHERE projects.id = ranked.id;

-- Create index for efficient queries when sorting by status and position
CREATE INDEX IF NOT EXISTS idx_projects_status_position ON projects(status, position);

-- Comment for documentation
COMMENT ON COLUMN projects.position IS 'Order position within the same status column for Kanban drag & drop';
