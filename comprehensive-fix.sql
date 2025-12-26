-- Comprehensive Fix for customerCount Column Issue
-- This script thoroughly addresses the "Could not find the 'customerCount' column of 'tables' in the schema cache" error

-- First, let's drop any existing column with similar names (to avoid conflicts)
-- Note: Be careful with this in production!
-- ALTER TABLE public.tables DROP COLUMN IF EXISTS "customerCount";
-- ALTER TABLE public.tables DROP COLUMN IF EXISTS "customercount";
-- ALTER TABLE public.tables DROP COLUMN IF EXISTS customercount;

-- Add the missing customerCount column to the tables table
ALTER TABLE public.tables ADD COLUMN IF NOT EXISTS "customerCount" INTEGER DEFAULT 0;

-- Add a comment to the column for documentation
COMMENT ON COLUMN public.tables."customerCount" IS 'Number of customers at the table';

-- Create an index on the new column for better performance
CREATE INDEX IF NOT EXISTS idx_tables_customer_count ON public.tables("customerCount");

-- Verify the column was added by selecting from the table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'tables' AND column_name = 'customerCount';

-- Try to select a sample row to verify the column works
SELECT id, "tableNumber", "customerCount" FROM public.tables LIMIT 1;

-- Show a message to the user
DO $$
BEGIN
    RAISE NOTICE 'Comprehensive schema fix applied successfully!';
    RAISE NOTICE 'IMPORTANT: You MUST restart your Supabase project for the changes to take effect.';
    RAISE NOTICE 'Go to Settings -> General -> Restart Project';
END $$;