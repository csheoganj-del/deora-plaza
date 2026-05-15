-- Add measurement columns to menu_items table
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS "measurement" TEXT,
ADD COLUMN IF NOT EXISTS "measurementUnit" TEXT,
ADD COLUMN IF NOT EXISTS "baseMeasurement" NUMERIC(10,2);