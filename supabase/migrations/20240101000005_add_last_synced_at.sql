-- Add last_synced_at field to campaigns table
ALTER TABLE campaigns ADD COLUMN last_synced_at TIMESTAMP WITH TIME ZONE;

-- Create index for faster queries on sync status
CREATE INDEX idx_campaigns_last_synced_at ON campaigns(last_synced_at);
