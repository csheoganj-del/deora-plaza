-- Fix orders table by adding missing columns
-- Run this in Supabase SQL Editor to add missing columns to orders table

-- Add missing columns to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS "orderNumber" TEXT,
ADD COLUMN IF NOT EXISTS "tableNumber" TEXT,
ADD COLUMN IF NOT EXISTS "roomNumber" TEXT,
ADD COLUMN IF NOT EXISTS "source" TEXT DEFAULT 'pos',
ADD COLUMN IF NOT EXISTS "totalAmount" NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "isPaid" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "guestCount" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "settlementStatus" TEXT DEFAULT 'not-required',
ADD COLUMN IF NOT EXISTS "pendingAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "preparingAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "readyAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "servedAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "timeline" JSONB DEFAULT '[]'::jsonb;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders("orderNumber");
CREATE INDEX IF NOT EXISTS idx_orders_table_number ON public.orders("tableNumber");
CREATE INDEX IF NOT EXISTS idx_orders_room_number ON public.orders("roomNumber");
CREATE INDEX IF NOT EXISTS idx_orders_source ON public.orders("source");
CREATE INDEX IF NOT EXISTS idx_orders_settlement_status ON public.orders("settlementStatus");
CREATE INDEX IF NOT EXISTS idx_orders_pending_at ON public.orders("pendingAt");
CREATE INDEX IF NOT EXISTS idx_orders_preparing_at ON public.orders("preparingAt");
CREATE INDEX IF NOT EXISTS idx_orders_ready_at ON public.orders("readyAt");
CREATE INDEX IF NOT EXISTS idx_orders_served_at ON public.orders("servedAt");
CREATE INDEX IF NOT EXISTS idx_orders_completed_at ON public.orders("completedAt");

-- Update existing orders to have proper timestamps if they don't exist
UPDATE public.orders
SET
    "pendingAt" = "createdAt"
WHERE "pendingAt" IS NULL AND "status" IN ('pending', 'preparing', 'ready', 'served', 'completed');

-- Update existing orders to generate order numbers if they don't exist
UPDATE public.orders
SET "orderNumber" = 'ORD-' || EXTRACT(EPOCH FROM "createdAt")::bigint::text
WHERE "orderNumber" IS NULL;

-- Set timeline for existing orders if empty
UPDATE public.orders
SET "timeline" = jsonb_build_array(
    jsonb_build_object(
        'status', 'pending',
        'timestamp', "createdAt",
        'actor', 'system',
        'message', 'Order placed'
    )
)
WHERE "timeline" IS NULL OR "timeline" = '[]'::jsonb;

-- Make orderNumber NOT NULL after updating existing records
ALTER TABLE public.orders ALTER COLUMN "orderNumber" SET NOT NULL;

-- Create unique constraint on orderNumber
ALTER TABLE public.orders ADD CONSTRAINT unique_order_number UNIQUE ("orderNumber");

-- Add check constraints for status transitions
ALTER TABLE public.orders ADD CONSTRAINT check_valid_status
CHECK ("status" IN ('pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'));

ALTER TABLE public.orders ADD CONSTRAINT check_valid_settlement_status
CHECK ("settlementStatus" IN ('pending', 'settled', 'not-required'));

-- Add comment to table
COMMENT ON TABLE public.orders IS 'Orders table with timeline tracking and settlement status';
COMMENT ON COLUMN public.orders."orderNumber" IS 'Unique order number for tracking';
COMMENT ON COLUMN public.orders."timeline" IS 'JSON array tracking order status changes';
COMMENT ON COLUMN public.orders."settlementStatus" IS 'Settlement status for department reconciliation';

-- Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'orders' AND table_schema = 'public'
ORDER BY ordinal_position;
