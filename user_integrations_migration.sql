-- Migration: Create user_integrations table
-- Run this SQL in your Supabase SQL editor to enable Google Calendar integration

CREATE TABLE IF NOT EXISTS user_integrations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  integration_type text NOT NULL CHECK (integration_type IN ('google_calendar', 'outlook', 'apple_calendar')),
  access_token text NOT NULL,
  refresh_token text,
  expires_at timestamptz,
  scope text[],
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Ensure one integration per type per user
  UNIQUE(user_id, integration_type)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS user_integrations_user_id_idx ON user_integrations(user_id);
CREATE INDEX IF NOT EXISTS user_integrations_type_idx ON user_integrations(integration_type);
CREATE INDEX IF NOT EXISTS user_integrations_expires_at_idx ON user_integrations(expires_at);

-- Enable Row Level Security
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only see their own integrations
CREATE POLICY "Users can only see their own integrations" ON user_integrations
  FOR ALL USING (auth.uid() = user_id);

-- Grant permissions to authenticated users
GRANT ALL ON user_integrations TO authenticated;
GRANT USAGE ON SCHEMA public TO authenticated;