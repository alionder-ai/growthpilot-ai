-- Remove duplicate 'name' column if it exists (we use 'campaign_name' instead)
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'name'
  ) THEN
    -- First, copy any data from 'name' to 'campaign_name' if 'campaign_name' is empty
    UPDATE campaigns 
    SET campaign_name = name 
    WHERE campaign_name IS NULL OR campaign_name = '' OR campaign_name = 'Unnamed Campaign';
    
    -- Now drop the 'name' column
    ALTER TABLE campaigns DROP COLUMN name;
    
    RAISE NOTICE 'Dropped duplicate "name" column from campaigns table';
  ELSE
    RAISE NOTICE 'No "name" column found in campaigns table';
  END IF;
END $$;

-- Ensure campaign_name exists and is NOT NULL
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'campaigns' AND column_name = 'campaign_name'
  ) THEN
    ALTER TABLE campaigns ADD COLUMN campaign_name VARCHAR(255) NOT NULL DEFAULT 'Unnamed Campaign';
    RAISE NOTICE 'Added campaign_name column';
  ELSE
    RAISE NOTICE 'campaign_name column already exists';
  END IF;
END $$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
