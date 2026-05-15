-- Temporarily disable RLS to test if that's the issue

-- Disable RLS completely for businesssettings table
ALTER TABLE public.businesssettings DISABLE ROW LEVEL SECURITY;

-- Test basic access
SELECT count(*) FROM businesssettings;

-- If this works, then RLS was the issue
-- We can re-enable it later with proper policies
