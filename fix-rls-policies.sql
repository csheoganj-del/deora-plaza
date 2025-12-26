-- Run these commands in the Supabase SQL Editor to fix RLS policies

-- First, let's check what tables actually exist
SELECT table_name FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE '%business%';

-- Option 1: Disable RLS for businesssettings table (simplest fix)
ALTER TABLE public.businesssettings DISABLE ROW LEVEL SECURITY;

-- Option 2: Enable RLS with proper policies (recommended for production)
-- Uncomment the following lines if you want to keep RLS enabled:

-- ALTER TABLE public.businesssettings ENABLE ROW LEVEL SECURITY;

-- -- Allow anon users to read businesssettings
-- CREATE POLICY "Allow anon to read businesssettings" ON public.businesssettings
--   FOR SELECT USING (true);

-- -- Allow anon users to insert businesssettings  
-- CREATE POLICY "Allow anon to insert businesssettings" ON public.businesssettings
--   FOR INSERT WITH CHECK (true);

-- -- Allow service role to do everything
-- CREATE POLICY "Allow service role full access" ON public.businesssettings
--   FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Test the fix
-- SELECT * FROM public.businesssettings LIMIT 1;
