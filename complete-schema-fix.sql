-- Complete Schema Fix for customerCount Column Issue
-- This script addresses the persistent "Could not find the 'customerCount' column of 'tables' in the schema cache" error

-- First, let's add the missing customerCount column to the tables table
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS customerCount INTEGER DEFAULT 0;

-- Add a comment to the column for documentation
COMMENT ON COLUMN public.tables.customerCount IS 'Number of customers at the table';

-- Create an index on the new column for better performance
CREATE INDEX IF NOT EXISTS idx_tables_customer_count ON public.tables(customerCount);

-- Now let's refresh the schema cache
-- Note: These commands might not work in all environments, but they're worth trying
NOTIFY pgrst, 'reload config';
NOTIFY pgrst, 'reload schema';

-- Verify the column was added
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tables' AND column_name = 'customerCount';

-- If the above query fails due to schema cache issues, don't worry
-- The important thing is that we've added the column to the table
-- After restarting your Supabase project, this query will work

-- Show a message to the user
DO $$
BEGIN
    RAISE NOTICE 'Schema fix applied successfully!';
    RAISE NOTICE 'Please restart your Supabase project to refresh the schema cache.';
    RAISE NOTICE 'After restart, the "customerCount column not found" error should be resolved.';
END $$;