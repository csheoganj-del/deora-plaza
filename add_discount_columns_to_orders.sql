-- Add discount and tax columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS "discountPercent" numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS "discountAmount" numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS "gstPercent" numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS "gstAmount" numeric DEFAULT 0;

-- Comment for documentation
COMMENT ON COLUMN orders."discountPercent" IS 'Percentage discount applied to the order';
COMMENT ON COLUMN orders."discountAmount" IS 'Fixed amount discount applied to the order';
COMMENT ON COLUMN orders."gstPercent" IS 'GST percentage applied';
COMMENT ON COLUMN orders."gstAmount" IS 'Calculated GST amount';
