-- Add campaign_id column to ai_recommendations table
-- This allows strategy cards to be linked to specific campaigns

ALTER TABLE ai_recommendations
ADD COLUMN campaign_id UUID REFERENCES campaigns(campaign_id) ON DELETE CASCADE;

-- Create index for faster queries by campaign
CREATE INDEX idx_ai_recommendations_campaign_id ON ai_recommendations(campaign_id);

-- Update RLS policy to include campaign access check
-- Drop existing policy
DROP POLICY IF EXISTS "Users can access recommendations for their clients" ON ai_recommendations;

-- Create new policy that checks both client and campaign ownership
CREATE POLICY "Users can access recommendations for their clients"
ON ai_recommendations
FOR ALL
USING (
  client_id IN (
    SELECT client_id FROM clients WHERE user_id = auth.uid()
  )
);
