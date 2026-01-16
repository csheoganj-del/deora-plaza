-- Migration: Add Room Service Columns to Bookings Table
-- This adds the missing columns that are preventing room service orders from being saved

-- Add roomServiceTotal column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'roomServiceTotal'
    ) THEN
        ALTER TABLE public.bookings 
        ADD COLUMN "roomServiceTotal" NUMERIC(10,2) DEFAULT 0;
        
        RAISE NOTICE 'Added roomServiceTotal column';
    ELSE
        RAISE NOTICE 'roomServiceTotal column already exists';
    END IF;
END $$;

-- Add roomServiceCharges column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' AND column_name = 'roomServiceCharges'
    ) THEN
        ALTER TABLE public.bookings 
        ADD COLUMN "roomServiceCharges" JSONB DEFAULT '[]'::jsonb;
        
        RAISE NOTICE 'Added roomServiceCharges column';
    ELSE
        RAISE NOTICE 'roomServiceCharges column already exists';
    END IF;
END $$;

-- Verify the columns were added
SELECT 
    column_name, 
    data_type, 
    column_default,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'bookings' 
AND column_name IN ('roomServiceCharges', 'roomServiceTotal')
ORDER BY column_name;
