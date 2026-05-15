-- Add GST columns to businessSettings table
ALTER TABLE businessSettings 
ADD COLUMN IF NOT EXISTS "gstEnabled" BOOLEAN DEFAULT false;

ALTER TABLE businessSettings 
ADD COLUMN IF NOT EXISTS "gstNumber" TEXT DEFAULT '';

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'businesssettings' 
AND column_name IN ('gstEnabled', 'gstNumber');