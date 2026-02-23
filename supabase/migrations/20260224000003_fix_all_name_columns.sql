-- Fix ad_sets table: Remove 'name' column if exists, ensure 'ad_set_name' exists
DO $$ 
BEGIN
  -- Check and remove 'name' column from ad_sets
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ad_sets' AND column_name = 'name'
  ) THEN
    -- Copy data from 'name' to 'ad_set_name' if needed
    UPDATE ad_sets 
    SET ad_set_name = name 
    WHERE ad_set_name IS NULL OR ad_set_name = '';
    
    -- Drop the 'name' column
    ALTER TABLE ad_sets DROP COLUMN name;
    
    RAISE NOTICE 'Dropped duplicate "name" column from ad_sets table';
  ELSE
    RAISE NOTICE 'No "name" column found in ad_sets table';
  END IF;
  
  -- Ensure ad_set_name exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ad_sets' AND column_name = 'ad_set_name'
  ) THEN
    ALTER TABLE ad_sets ADD COLUMN ad_set_name VARCHAR(255) NOT NULL DEFAULT 'Unnamed Ad Set';
    RAISE NOTICE 'Added ad_set_name column to ad_sets';
  END IF;
END $$;

-- Fix ads table: Remove 'name' column if exists, ensure 'ad_name' exists
DO $$ 
BEGIN
  -- Check and remove 'name' column from ads
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ads' AND column_name = 'name'
  ) THEN
    -- Copy data from 'name' to 'ad_name' if needed
    UPDATE ads 
    SET ad_name = name 
    WHERE ad_name IS NULL OR ad_name = '';
    
    -- Drop the 'name' column
    ALTER TABLE ads DROP COLUMN name;
    
    RAISE NOTICE 'Dropped duplicate "name" column from ads table';
  ELSE
    RAISE NOTICE 'No "name" column found in ads table';
  END IF;
  
  -- Ensure ad_name exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'ads' AND column_name = 'ad_name'
  ) THEN
    ALTER TABLE ads ADD COLUMN ad_name VARCHAR(255) NOT NULL DEFAULT 'Unnamed Ad';
    RAISE NOTICE 'Added ad_name column to ads';
  END IF;
END $$;

-- Reload schema cache
NOTIFY pgrst, 'reload schema';
