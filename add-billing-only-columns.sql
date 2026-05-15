-- Add billing-only mode columns to businessSettings table

ALTER TABLE "businessSettings" 
ADD COLUMN IF NOT EXISTS "billingOnlyMode" boolean DEFAULT false;

ALTER TABLE "businessSettings" 
ADD COLUMN IF NOT EXISTS "cafeBillingOnlyMode" boolean DEFAULT false;

ALTER TABLE "businessSettings" 
ADD COLUMN IF NOT EXISTS "barBillingOnlyMode" boolean DEFAULT false;

ALTER TABLE "businessSettings" 
ADD COLUMN IF NOT EXISTS "hotelBillingOnlyMode" boolean DEFAULT false;

ALTER TABLE "businessSettings" 
ADD COLUMN IF NOT EXISTS "gardenBillingOnlyMode" boolean DEFAULT false;

-- Verify the columns were added
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'businessSettings'
AND column_name LIKE '%billing%'
ORDER BY column_name;
