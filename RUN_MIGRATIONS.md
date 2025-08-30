# Database Migration Instructions

## Issue
The `completed_at` column is missing from the `todos` table, causing errors when updating todo completion status.

## Solution
Run the following migration to add the missing column:

### Option 1: Using Supabase CLI
```bash
# If you have Supabase CLI installed
supabase db diff --local --schema public
supabase db push
```

### Option 2: Manual SQL Execution
1. Go to your Supabase Dashboard
2. Navigate to SQL Editor
3. Run the following SQL:

```sql
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
```

### Option 3: Copy from migration file
The migration SQL is also available in:
`supabase/migration_add_completed_at.sql`

## After Running Migration
Once the migration is complete, analytics and todo completion tracking will work fully.