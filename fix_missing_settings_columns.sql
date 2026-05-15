
-- Run this in your Supabase SQL Editor to fix the settings persistence issue

-- Add global GST percentage if missing
ALTER TABLE "businessSettings" ADD COLUMN IF NOT EXISTS "gstPercentage" numeric(5,2) DEFAULT 0;

-- Add Per-unit GST settings
ALTER TABLE "businessSettings" ADD COLUMN IF NOT EXISTS "barGstEnabled" boolean DEFAULT false;
ALTER TABLE "businessSettings" ADD COLUMN IF NOT EXISTS "barGstPercentage" numeric(5,2) DEFAULT 0;
ALTER TABLE "businessSettings" ADD COLUMN IF NOT EXISTS "cafeGstEnabled" boolean DEFAULT false;
ALTER TABLE "businessSettings" ADD COLUMN IF NOT EXISTS "cafeGstPercentage" numeric(5,2) DEFAULT 0;
ALTER TABLE "businessSettings" ADD COLUMN IF NOT EXISTS "hotelGstEnabled" boolean DEFAULT false;
ALTER TABLE "businessSettings" ADD COLUMN IF NOT EXISTS "hotelGstPercentage" numeric(5,2) DEFAULT 0;
ALTER TABLE "businessSettings" ADD COLUMN IF NOT EXISTS "gardenGstEnabled" boolean DEFAULT false;
ALTER TABLE "businessSettings" ADD COLUMN IF NOT EXISTS "gardenGstPercentage" numeric(5,2) DEFAULT 0;

-- Add Per-unit Waiterless Mode settings
ALTER TABLE "businessSettings" ADD COLUMN IF NOT EXISTS "barWaiterlessMode" boolean DEFAULT false;
ALTER TABLE "businessSettings" ADD COLUMN IF NOT EXISTS "cafeWaiterlessMode" boolean DEFAULT false;
ALTER TABLE "businessSettings" ADD COLUMN IF NOT EXISTS "hotelWaiterlessMode" boolean DEFAULT false;
ALTER TABLE "businessSettings" ADD COLUMN IF NOT EXISTS "gardenWaiterlessMode" boolean DEFAULT false;

-- Add Module toggles
ALTER TABLE "businessSettings" ADD COLUMN IF NOT EXISTS "enableBarModule" boolean DEFAULT true;
ALTER TABLE "businessSettings" ADD COLUMN IF NOT EXISTS "enablePasswordProtection" boolean DEFAULT true;
ALTER TABLE "businessSettings" ADD COLUMN IF NOT EXISTS "waiterlessMode" boolean DEFAULT false;

-- Verify the columns were added (optional, just for info)
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'businessSettings';
