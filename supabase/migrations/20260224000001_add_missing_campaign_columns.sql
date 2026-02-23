-- Add missing campaign_name column if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'campaign_name'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN campaign_name VARCHAR(255) NOT NULL DEFAULT 'Unnamed Campaign';
  END IF;
END $$;

-- Add last_synced_at column if it doesn't exist (for tracking sync status)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'last_synced_at'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN last_synced_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
