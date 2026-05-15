
-- Add measurement columns to menu_items table for Bar module
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "measurement" TEXT; -- e.g. "30ml", "60ml", "Bottle"
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "measurementUnit" TEXT; -- e.g. "ml", "bottle"
ALTER TABLE "menu_items" ADD COLUMN IF NOT EXISTS "baseMeasurement" NUMERIC(10,2); -- e.g. 30, 60, 750

-- Add logic to support multiple variants if needed in the future, 
-- but for now we stick to the requested simple ml vs bottle distinction on the item itself.

COMMENT ON COLUMN "menu_items"."measurement" IS 'Display string for quantity (e.g., 30ml)';
COMMENT ON COLUMN "menu_items"."measurementUnit" IS 'Unit of measurement (ml, bottle)';
COMMENT ON COLUMN "menu_items"."baseMeasurement" IS 'Numeric value of the measurement';
