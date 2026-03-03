-- Add objective column to campaigns table
ALTER TABLE campaigns
  ADD COLUMN IF NOT EXISTS objective VARCHAR(100);
