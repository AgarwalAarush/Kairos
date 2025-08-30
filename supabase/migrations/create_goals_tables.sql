-- Create daily_goals table
CREATE TABLE IF NOT EXISTS daily_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    goal TEXT NOT NULL,
    completed BOOLEAN DEFAULT FALSE,
    date DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create long_term_goals table
CREATE TABLE IF NOT EXISTS long_term_goals (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    target_date DATE NOT NULL,
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    completed BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS daily_goals_user_date_idx ON daily_goals(user_id, date);
CREATE INDEX IF NOT EXISTS daily_goals_date_idx ON daily_goals(date);
CREATE INDEX IF NOT EXISTS long_term_goals_user_idx ON long_term_goals(user_id);
CREATE INDEX IF NOT EXISTS long_term_goals_target_date_idx ON long_term_goals(target_date);

-- Enable RLS (Row Level Security)
ALTER TABLE daily_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE long_term_goals ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for daily_goals
CREATE POLICY "Users can view their own daily goals" ON daily_goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own daily goals" ON daily_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own daily goals" ON daily_goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own daily goals" ON daily_goals
    FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for long_term_goals
CREATE POLICY "Users can view their own long-term goals" ON long_term_goals
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own long-term goals" ON long_term_goals
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own long-term goals" ON long_term_goals
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own long-term goals" ON long_term_goals
    FOR DELETE USING (auth.uid() = user_id);

-- Create updated_at triggers
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_daily_goals_updated_at BEFORE UPDATE ON daily_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_long_term_goals_updated_at BEFORE UPDATE ON long_term_goals
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();