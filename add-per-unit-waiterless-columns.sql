-- Migration script to add per-unit waiterless mode columns to businessSettings table
-- This script adds columns for controlling waiterless mode per business unit

-- Add per-unit waiterless mode columns
ALTER TABLE public."businessSettings" 
ADD COLUMN IF NOT EXISTS "barWaiterlessMode" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "cafeWaiterlessMode" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "hotelWaiterlessMode" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "gardenWaiterlessMode" BOOLEAN DEFAULT false;

-- Add comments for clarity
COMMENT ON COLUMN public."businessSettings"."barWaiterlessMode" IS 'Enable waiterless mode for bar unit';
COMMENT ON COLUMN public."businessSettings"."cafeWaiterlessMode" IS 'Enable waiterless mode for cafe unit';
COMMENT ON COLUMN public."businessSettings"."hotelWaiterlessMode" IS 'Enable waiterless mode for hotel unit';
COMMENT ON COLUMN public."businessSettings"."gardenWaiterlessMode" IS 'Enable waiterless mode for garden unit';

-- Update existing records to ensure default values are set
UPDATE public."businessSettings" 
SET 
    "barWaiterlessMode" = false,
    "cafeWaiterlessMode" = false,
    "hotelWaiterlessMode" = false,
    "gardenWaiterlessMode" = false
WHERE "id" = 'default';

-- Grant permissions for the new columns
GRANT ALL ON TABLE public."businessSettings" TO anon;
GRANT ALL ON TABLE public."businessSettings" TO authenticated;