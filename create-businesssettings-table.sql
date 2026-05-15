-- Run these commands in Supabase SQL Editor to create the missing businesssettings table

-- First, check what tables currently exist
SELECT table_name, table_type FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE '%business%'
ORDER BY table_name;

-- If businesssettings table doesn't exist, create it
CREATE TABLE IF NOT EXISTS public.businesssettings (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "mobile" TEXT NOT NULL,
  "waiterlessMode" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for the new table
ALTER TABLE public.businesssettings ENABLE ROW LEVEL SECURITY;

-- Create policies to allow anon access
CREATE POLICY "Allow anon to read businesssettings" ON public.businesssettings
  FOR SELECT USING (true);

CREATE POLICY "Allow anon to insert businesssettings" ON public.businesssettings
  FOR INSERT WITH CHECK (true);

-- Allow service role to do everything
CREATE POLICY "Allow service role full access" ON public.businesssettings
  FOR ALL USING (auth.jwt()->>'role' = 'service_role');

-- Test the table creation
SELECT * FROM public.businesssettings LIMIT 1;

-- Show all business-related tables for verification
SELECT table_name, table_type FROM information_schema.tables 
WHERE table_schema = 'public' AND table_name LIKE '%business%'
ORDER BY table_name;
