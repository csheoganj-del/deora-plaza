-- Add per-unit GST columns to businessSettings table
ALTER TABLE public."businessSettings" 
ADD COLUMN IF NOT EXISTS "barGstEnabled" BOOLEAN DEFAULT false;

ALTER TABLE public."businessSettings" 
ADD COLUMN IF NOT EXISTS "barGstPercentage" NUMERIC(5,2) DEFAULT 0;

ALTER TABLE public."businessSettings" 
ADD COLUMN IF NOT EXISTS "cafeGstEnabled" BOOLEAN DEFAULT false;

ALTER TABLE public."businessSettings" 
ADD COLUMN IF NOT EXISTS "cafeGstPercentage" NUMERIC(5,2) DEFAULT 0;

ALTER TABLE public."businessSettings" 
ADD COLUMN IF NOT EXISTS "hotelGstEnabled" BOOLEAN DEFAULT false;

ALTER TABLE public."businessSettings" 
ADD COLUMN IF NOT EXISTS "hotelGstPercentage" NUMERIC(5,2) DEFAULT 0;

ALTER TABLE public."businessSettings" 
ADD COLUMN IF NOT EXISTS "gardenGstEnabled" BOOLEAN DEFAULT false;

ALTER TABLE public."businessSettings" 
ADD COLUMN IF NOT EXISTS "gardenGstPercentage" NUMERIC(5,2) DEFAULT 0;

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'businessSettings' 
AND column_name IN ('barGstEnabled', 'barGstPercentage', 'cafeGstEnabled', 'cafeGstPercentage', 'hotelGstEnabled', 'hotelGstPercentage', 'gardenGstEnabled', 'gardenGstPercentage');