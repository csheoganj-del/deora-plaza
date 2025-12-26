-- Add missing GST columns to existing businessSettings table
ALTER TABLE public."businessSettings" 
ADD COLUMN IF NOT EXISTS "gstEnabled" BOOLEAN DEFAULT false;

ALTER TABLE public."businessSettings" 
ADD COLUMN IF NOT EXISTS "gstNumber" TEXT DEFAULT '';

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'businessSettings' 
AND column_name IN ('gstEnabled', 'gstNumber');