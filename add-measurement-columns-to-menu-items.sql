-- Add measurement columns to menu_items table
-- These columns support portion-based serving options for bar items
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS "measurement" TEXT,
ADD COLUMN IF NOT EXISTS "measurementUnit" TEXT,
ADD COLUMN IF NOT EXISTS "baseMeasurement" NUMERIC(10,2);

-- Add comments for documentation
COMMENT ON COLUMN public.menu_items."measurement" IS 'The measurement for this item (e.g., 30ml, 150ml)';
COMMENT ON COLUMN public.menu_items."measurementUnit" IS 'The unit of measurement (e.g., ml, oz)';
COMMENT ON COLUMN public.menu_items."baseMeasurement" IS 'The base measurement size for the container (e.g., 750 for a 750ml bottle)';

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_menu_items_measurement ON public.menu_items("measurement");
CREATE INDEX IF NOT EXISTS idx_menu_items_measurement_unit ON public.menu_items("measurementUnit");