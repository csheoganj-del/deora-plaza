-- Fix Bills Table Structure for DEORA POS System
-- This SQL adds all missing columns to the bills table

-- First, check if bills table exists and add missing columns
ALTER TABLE public.bills
ADD COLUMN IF NOT EXISTS "billNumber" TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS "orderId" UUID,
ADD COLUMN IF NOT EXISTS "customerMobile" TEXT,
ADD COLUMN IF NOT EXISTS "customerName" TEXT,
ADD COLUMN IF NOT EXISTS "subtotal" NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS "discountPercent" NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS "discountAmount" NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS "gstPercent" NUMERIC(5,2),
ADD COLUMN IF NOT EXISTS "gstAmount" NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS "grandTotal" NUMERIC(10,2),
ADD COLUMN IF NOT EXISTS "amountPaid" NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "paymentMethod" TEXT,
ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS "source" TEXT,
ADD COLUMN IF NOT EXISTS "address" TEXT,
ADD COLUMN IF NOT EXISTS "items" JSONB,
ADD COLUMN IF NOT EXISTS "createdBy" TEXT;

-- If bills table doesn't exist, create it from scratch
CREATE TABLE IF NOT EXISTS public.bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "billNumber" TEXT UNIQUE NOT NULL,
  "orderId" UUID,
  "businessUnit" TEXT NOT NULL,
  "customerMobile" TEXT,
  "customerName" TEXT,
  "subtotal" NUMERIC(10,2),
  "discountPercent" NUMERIC(5,2),
  "discountAmount" NUMERIC(10,2),
  "gstPercent" NUMERIC(5,2),
  "gstAmount" NUMERIC(10,2),
  "grandTotal" NUMERIC(10,2),
  "amountPaid" NUMERIC(10,2) DEFAULT 0,
  "paymentMethod" TEXT,
  "paymentStatus" TEXT DEFAULT 'pending',
  "source" TEXT,
  "address" TEXT,
  "items" JSONB,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for bills table
CREATE INDEX IF NOT EXISTS idx_bills_bill_number ON public.bills("billNumber");
CREATE INDEX IF NOT EXISTS idx_bills_order_id ON public.bills("orderId");
CREATE INDEX IF NOT EXISTS idx_bills_business_unit ON public.bills("businessUnit");
CREATE INDEX IF NOT EXISTS idx_bills_payment_status ON public.bills("paymentStatus");
CREATE INDEX IF NOT EXISTS idx_bills_customer_mobile ON public.bills("customerMobile");
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON public.bills("createdAt");
CREATE INDEX IF NOT EXISTS idx_bills_payment_method ON public.bills("paymentMethod");
CREATE INDEX IF NOT EXISTS idx_bills_source ON public.bills("source");

-- Add constraints for data integrity
DO $$
BEGIN
    -- Add check constraint for payment status
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'check_valid_payment_status'
        AND conrelid = 'public.bills'::regclass
    ) THEN
        ALTER TABLE public.bills ADD CONSTRAINT check_valid_payment_status
        CHECK ("paymentStatus" IN ('pending', 'paid', 'partial', 'cancelled', 'refunded'));
    END IF;

    -- Add check constraint for payment method
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'check_valid_payment_method'
        AND conrelid = 'public.bills'::regclass
    ) THEN
        ALTER TABLE public.bills ADD CONSTRAINT check_valid_payment_method
        CHECK ("paymentMethod" IN ('cash', 'card', 'upi', 'online', 'credit'));
    END IF;

    -- Add check constraint for business unit
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'check_valid_business_unit_bills'
        AND conrelid = 'public.bills'::regclass
    ) THEN
        ALTER TABLE public.bills ADD CONSTRAINT check_valid_business_unit_bills
        CHECK ("businessUnit" IN ('cafe', 'restaurant', 'bar', 'hotel', 'garden'));
    END IF;

    -- Add check constraint for positive amounts
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'check_positive_amounts'
        AND conrelid = 'public.bills'::regclass
    ) THEN
        ALTER TABLE public.bills ADD CONSTRAINT check_positive_amounts
        CHECK ("subtotal" >= 0 AND "grandTotal" >= 0 AND "amountPaid" >= 0);
    END IF;
END $$;

-- Enable Row Level Security
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;

-- Add table and column comments
COMMENT ON TABLE public.bills IS 'Bills and invoices for order payments with tax and discount tracking';
COMMENT ON COLUMN public.bills."billNumber" IS 'Unique sequential bill number for customer reference';
COMMENT ON COLUMN public.bills."orderId" IS 'Reference to the order this bill belongs to';
COMMENT ON COLUMN public.bills."paymentStatus" IS 'Current payment status (pending/paid/partial/cancelled/refunded)';
COMMENT ON COLUMN public.bills."items" IS 'JSON array of billed items with quantities and prices';
COMMENT ON COLUMN public.bills."source" IS 'Order source (dine-in/takeaway/online/zomato/swiggy)';

-- Verify the bills table structure
SELECT
    'bills' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'bills'
AND table_schema = 'public'
AND column_name IN ('billNumber', 'orderId', 'paymentStatus', 'grandTotal', 'items')
ORDER BY column_name;

-- Show success message
SELECT 'Bills table structure fixed successfully! Bill generation should now work.' as status;
