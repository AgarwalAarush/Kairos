-- Migration: Create pomodoro_sessions table
-- Run this SQL in your Supabase SQL editor to enable pomodoro statistics tracking

CREATE TABLE IF NOT EXISTS pomodoro_sessions (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_type text NOT NULL CHECK (session_type IN ('work', 'break', 'longBreak')),
  duration_minutes integer NOT NULL CHECK (duration_minutes > 0),
  completed boolean DEFAULT false,
  interrupted boolean DEFAULT false,
  started_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  created_at timestamptz DEFAULT now()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS pomodoro_sessions_user_id_idx ON pomodoro_sessions(user_id);
CREATE INDEX IF NOT EXISTS pomodoro_sessions_created_at_idx ON pomodoro_sessions(created_at);
CREATE INDEX IF NOT EXISTS pomodoro_sessions_session_type_idx ON pomodoro_sessions(session_type);

-- Enable Row Level Security
ALTER TABLE pomodoro_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see their own sessions
CREATE POLICY "Users can only see their own pomodoro sessions" ON pomodoro_sessions
  FOR ALL USING (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT ALL ON pomodoro_sessions TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;