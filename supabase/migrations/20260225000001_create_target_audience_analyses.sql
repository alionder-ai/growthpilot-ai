-- Create target_audience_analyses table for storing AI-generated strategic analyses
CREATE TABLE target_audience_analyses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  industry TEXT NOT NULL,
  analysis_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on user_id for faster user-specific queries
CREATE INDEX idx_target_audience_analyses_user_id ON target_audience_analyses(user_id);

-- Create index on created_at for efficient sorting and history retrieval
CREATE INDEX idx_target_audience_analyses_created_at ON target_audience_analyses(created_at DESC);

-- Enable Row-Level Security
ALTER TABLE target_audience_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only access their own analyses
CREATE POLICY "Users can access only their own analyses"
  ON target_audience_analyses FOR ALL
  USING (user_id = auth.uid());
