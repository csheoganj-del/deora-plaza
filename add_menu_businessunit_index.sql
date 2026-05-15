-- Add missing businessUnit index to menu_items table
-- This will dramatically speed up menu loading when filtering by business unit

DO $$
BEGIN
  -- Check if businessUnit column exists (it might be business_unit in some schemas)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'menu_items' AND column_name = 'businessUnit'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_menu_items_business_unit ON menu_items("businessUnit");
    RAISE NOTICE 'Created index on menu_items.businessUnit';
  ELSIF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'menu_items' AND column_name = 'business_unit'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_menu_items_business_unit ON menu_items(business_unit);
    RAISE NOTICE 'Created index on menu_items.business_unit';
  ELSE
    RAISE NOTICE 'businessUnit column not found in menu_items table';
  END IF;

  -- Also add composite index for common query pattern (businessUnit + isAvailable)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'menu_items' AND column_name = 'businessUnit'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'menu_items' AND column_name = 'isAvailable'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_menu_items_business_unit_available 
    ON menu_items("businessUnit", "isAvailable") 
    WHERE "isAvailable" = true;
    RAISE NOTICE 'Created composite index on menu_items(businessUnit, isAvailable)';
  END IF;
END $$;

-- Analyze the table to update query planner statistics
ANALYZE menu_items;

SELECT 'Menu items performance indexes created! Query speed should improve significantly. 🚀' as status;
