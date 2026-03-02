-- Add recommendation_type column to ai_recommendations table
-- This allows distinguishing between different types of AI recommendations
-- (e.g., 'strategy_card', 'action_plan', 'optimization', etc.)

ALTER TABLE ai_recommendations 
  ADD COLUMN IF NOT EXISTS recommendation_type TEXT DEFAULT 'strategy_card';

-- Add a comment to document the column
COMMENT ON COLUMN ai_recommendations.recommendation_type IS 
  'Type of AI recommendation: strategy_card, action_plan, optimization, etc.';

-- Optional: Create an index if you plan to filter by recommendation_type frequently
CREATE INDEX IF NOT EXISTS idx_ai_recommendations_type 
  ON ai_recommendations(recommendation_type);
