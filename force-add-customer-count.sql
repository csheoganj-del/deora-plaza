-- Force add the customerCount column to the tables table
-- This script bypasses some of the schema cache issues by using a more direct approach

-- First, check if the column exists
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'tables' AND column_name = 'customerCount';

-- If the above query fails due to schema cache issues, let's try to add the column anyway
-- We'll use IF NOT EXISTS to prevent errors if it already exists
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS customerCount INTEGER DEFAULT 0;

-- Add a comment to the column for documentation
COMMENT ON COLUMN public.tables.customerCount IS 'Number of customers at the table';

-- Verify the column was added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tables' AND column_name = 'customerCount';

-- If the above still fails, let's try a different approach
-- Create a simple function to test if we can access the tables table
CREATE OR REPLACE FUNCTION test_tables_access()
RETURNS TABLE(column_name TEXT)
AS $$
BEGIN
    RETURN QUERY 
    SELECT c.column_name::TEXT
    FROM information_schema.columns c
    WHERE c.table_name = 'tables' AND c.table_schema = 'public';
END;
$$ LANGUAGE plpgsql;

-- Call the function
SELECT * FROM test_tables_access();

-- Drop the test function
DROP FUNCTION IF EXISTS test_tables_access();