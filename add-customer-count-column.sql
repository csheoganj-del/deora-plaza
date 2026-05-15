-- Script to add the missing customerCount column to the tables table
-- This fixes the "Could not find the 'customerCount' column of 'tables' in the schema cache" error

-- Add customerCount column to tables table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'tables' AND column_name = 'customercount'
    ) THEN
        ALTER TABLE tables ADD COLUMN customerCount INTEGER DEFAULT 0;
        RAISE NOTICE 'Added customerCount column to tables table';
    ELSE
        RAISE NOTICE 'customerCount column already exists in tables table';
    END IF;
END $$;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'tables' AND column_name = 'customercount';

RAISE NOTICE 'Script completed. The customerCount column should now be available in the tables table.';