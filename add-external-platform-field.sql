-- Add external platform field to bills table
-- This migration adds support for external delivery platforms (Zomato, Swiggy, etc.)

-- Add the externalPlatform column to the bills table
ALTER TABLE public.bills 
ADD COLUMN "externalPlatform" TEXT;

-- Add index for better query performance on external platform reporting
CREATE INDEX IF NOT EXISTS idx_bills_external_platform ON public.bills("externalPlatform");

-- Add comment to document the field
COMMENT ON COLUMN public.bills."externalPlatform" IS 'External delivery platform (zomato, swiggy, uber_eats, foodpanda, other) when source is external';

-- Update existing records that have zomato/swiggy as source to set externalPlatform
UPDATE public.bills 
SET "externalPlatform" = "source" 
WHERE "source" IN ('zomato', 'swiggy') AND "externalPlatform" IS NULL;
