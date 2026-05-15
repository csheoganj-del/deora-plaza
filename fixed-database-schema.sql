-- Fixed Database Schema for DEORA POS System
-- This version handles existing constraints properly

-- Create notifications table
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "type" TEXT NOT NULL,
  "businessUnit" TEXT,
  "message" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "recipient" TEXT NOT NULL,
  "metadata" JSONB DEFAULT '{}'::jsonb,
  "isRead" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns to orders table
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS "orderNumber" TEXT,
ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "timeline" JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS "settlementStatus" TEXT DEFAULT 'not-required',
ADD COLUMN IF NOT EXISTS "totalAmount" NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "isPaid" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "pendingAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "preparingAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "readyAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "servedAt" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "tableNumber" TEXT,
ADD COLUMN IF NOT EXISTS "roomNumber" TEXT,
ADD COLUMN IF NOT EXISTS "source" TEXT DEFAULT 'pos',
ADD COLUMN IF NOT EXISTS "guestCount" INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS "billId" UUID,
ADD COLUMN IF NOT EXISTS "bookingId" UUID;

-- Update existing orders with missing data
UPDATE public.orders
SET "orderNumber" = 'ORD-' || EXTRACT(EPOCH FROM "createdAt")::bigint::text
WHERE "orderNumber" IS NULL OR "orderNumber" = '';

UPDATE public.orders
SET "pendingAt" = "createdAt"
WHERE "pendingAt" IS NULL AND "createdAt" IS NOT NULL;

UPDATE public.orders
SET "timeline" = jsonb_build_array(
  jsonb_build_object(
    'status', 'pending',
    'timestamp', "createdAt",
    'actor', 'system',
    'message', 'Order placed'
  )
)
WHERE ("timeline" IS NULL OR "timeline" = '[]'::jsonb) AND "createdAt" IS NOT NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders("orderNumber");
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders("status");
CREATE INDEX IF NOT EXISTS idx_orders_business_unit ON public.orders("businessUnit");
CREATE INDEX IF NOT EXISTS idx_orders_completed_at ON public.orders("completedAt");
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders("createdAt");
CREATE INDEX IF NOT EXISTS idx_orders_table_number ON public.orders("tableNumber");
CREATE INDEX IF NOT EXISTS idx_orders_room_number ON public.orders("roomNumber");
CREATE INDEX IF NOT EXISTS idx_orders_settlement_status ON public.orders("settlementStatus");

-- Create indexes for notifications table
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications("type");
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications("recipient");
CREATE INDEX IF NOT EXISTS idx_notifications_business_unit ON public.notifications("businessUnit");
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications("isRead");
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications("createdAt");

-- Add constraints using DO blocks to handle existing constraints
DO $$
BEGIN
    -- Add unique constraint on orderNumber
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'unique_order_number'
        AND conrelid = 'public.orders'::regclass
    ) THEN
        ALTER TABLE public.orders ADD CONSTRAINT unique_order_number UNIQUE ("orderNumber");
    END IF;

    -- Add check constraint for status
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'check_valid_status'
        AND conrelid = 'public.orders'::regclass
    ) THEN
        ALTER TABLE public.orders ADD CONSTRAINT check_valid_status
        CHECK ("status" IN ('pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'));
    END IF;

    -- Add check constraint for settlement status
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'check_valid_settlement_status'
        AND conrelid = 'public.orders'::regclass
    ) THEN
        ALTER TABLE public.orders ADD CONSTRAINT check_valid_settlement_status
        CHECK ("settlementStatus" IN ('pending', 'settled', 'not-required'));
    END IF;

    -- Add check constraint for notification priority
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'check_valid_notification_priority'
        AND conrelid = 'public.notifications'::regclass
    ) THEN
        ALTER TABLE public.notifications ADD CONSTRAINT check_valid_notification_priority
        CHECK ("type" IN ('order_placed', 'order_ready', 'payment_received', 'kitchen_alert', 'system_notification'));
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Add some helpful table comments
COMMENT ON TABLE public.orders IS 'Orders table with timeline tracking and settlement management';
COMMENT ON TABLE public.notifications IS 'System notifications for kitchen alerts and order updates';
COMMENT ON COLUMN public.orders."orderNumber" IS 'Unique sequential order number for customer reference';
COMMENT ON COLUMN public.orders."timeline" IS 'JSON timeline tracking order status changes with timestamps';
COMMENT ON COLUMN public.orders."settlementStatus" IS 'Settlement status for daily reconciliation (pending/settled/not-required)';
COMMENT ON COLUMN public.orders."completedAt" IS 'Timestamp when order was completed - fixes the missing column error';

-- Verify the schema changes
SELECT
    'orders' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'orders'
AND table_schema = 'public'
AND column_name IN ('orderNumber', 'completedAt', 'timeline', 'settlementStatus', 'totalAmount')
ORDER BY column_name;

-- Show confirmation message
SELECT 'Database schema updated successfully! The completedAt column and other missing fields have been added.' as status;
