-- Migration: Add completed_at field to todos table
-- This adds the completed_at timestamp field for tracking when tasks are completed

-- Add the completed_at column
ALTER TABLE todos ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_todos_completed_at ON todos(completed_at DESC);

-- Update existing completed todos to have a completed_at timestamp
-- This sets completed_at to updated_at for existing completed todos
-- This is an approximation for historical data
UPDATE todos 
SET completed_at = updated_at 
WHERE completed = true AND completed_at IS NULL;