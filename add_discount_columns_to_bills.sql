-- Add discount and tax columns to bills table
ALTER TABLE bills
ADD COLUMN IF NOT EXISTS "discountPercent" numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS "discountAmount" numeric DEFAULT 0;

-- Comment for documentation
COMMENT ON COLUMN bills."discountPercent" IS 'Percentage discount applied to the bill';
COMMENT ON COLUMN bills."discountAmount" IS 'Fixed amount discount applied to the bill';
