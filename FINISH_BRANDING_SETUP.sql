-- COPY AND RUN THIS IN YOUR SUPABASE SQL EDITOR
-- This will add the missing columns for Hotel Branding persistence

-- 1. Add Hotel Branding columns
ALTER TABLE public."businessSettings" 
ADD COLUMN IF NOT EXISTS "hotelName" TEXT;

ALTER TABLE public."businessSettings" 
ADD COLUMN IF NOT EXISTS "hotelAddress" TEXT;

ALTER TABLE public."businessSettings" 
ADD COLUMN IF NOT EXISTS "hotelMobile" TEXT;

ALTER TABLE public."businessSettings" 
ADD COLUMN IF NOT EXISTS "hotelEmail" TEXT;

ALTER TABLE public."businessSettings" 
ADD COLUMN IF NOT EXISTS "hotelGstNumber" TEXT;

-- 2. Verify columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'businessSettings' 
AND column_name LIKE 'hotel%';

-- 3. Success Message
-- Once this runs, go back to Settings > Business Settings and your Hotel details will Save correctly!
