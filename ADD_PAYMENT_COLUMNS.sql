-- =====================================================
-- COMPREHENSIVE HOTEL BOOKING PAYMENT COLUMNS MIGRATION
-- =====================================================
-- This migration adds all missing columns needed for:
-- 1. Payment tracking and recording
-- 2. Auto-checkout functionality
-- 3. Room availability management
-- =====================================================

-- Add payment tracking columns
ALTER TABLE public."bookings"
ADD COLUMN IF NOT EXISTS "paidAmount" numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS "remainingBalance" numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS "paymentStatus" text DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS "payments" jsonb DEFAULT '[]'::jsonb;

-- Add checkout tracking columns
ALTER TABLE public."bookings"
ADD COLUMN IF NOT EXISTS "checkIn" timestamptz,
ADD COLUMN IF NOT EXISTS "checkOut" timestamptz;

-- Add additional booking fields if missing
ALTER TABLE public."bookings"
ADD COLUMN IF NOT EXISTS "guestName" text,
ADD COLUMN IF NOT EXISTS "guestEmail" text,
ADD COLUMN IF NOT EXISTS "roomNumber" text,
ADD COLUMN IF NOT EXISTS "receiptNumber" text;

-- Update existing bookings to have correct initial values
UPDATE public."bookings"
SET 
    "paidAmount" = COALESCE("advancePayment", 0),
    "remainingBalance" = "totalAmount" - COALESCE("advancePayment", 0),
    "paymentStatus" = CASE 
        WHEN COALESCE("advancePayment", 0) >= "totalAmount" THEN 'completed'
        WHEN COALESCE("advancePayment", 0) > 0 THEN 'partial'
        ELSE 'pending'
    END,
    "payments" = CASE 
        WHEN COALESCE("advancePayment", 0) > 0 THEN 
            jsonb_build_array(
                jsonb_build_object(
                    'id', 'advance_' || "id",
                    'amount', "advancePayment",
                    'type', 'advance',
                    'method', 'cash',
                    'date', "createdAt",
                    'createdAt', "createdAt"
                )
            )
        ELSE '[]'::jsonb
    END
WHERE "paidAmount" IS NULL OR "payments" IS NULL OR "payments" = '[]'::jsonb;

-- Add helpful comments
COMMENT ON COLUMN public."bookings"."paidAmount" IS 'Total amount paid so far across all payments';
COMMENT ON COLUMN public."bookings"."remainingBalance" IS 'Remaining balance to be paid (totalAmount - paidAmount)';
COMMENT ON COLUMN public."bookings"."paymentStatus" IS 'Payment status: pending, partial, or completed';
COMMENT ON COLUMN public."bookings"."payments" IS 'Array of payment objects with id, amount, type, method, date';
COMMENT ON COLUMN public."bookings"."checkIn" IS 'Actual check-in timestamp';
COMMENT ON COLUMN public."bookings"."checkOut" IS 'Actual check-out timestamp (set when fully paid)';
COMMENT ON COLUMN public."bookings"."guestName" IS 'Guest name for display';
COMMENT ON COLUMN public."bookings"."guestEmail" IS 'Guest email for communication';
COMMENT ON COLUMN public."bookings"."roomNumber" IS 'Denormalized room number for quick display';
COMMENT ON COLUMN public."bookings"."receiptNumber" IS 'Receipt number for this booking';

-- Create index on payment status for faster queries
CREATE INDEX IF NOT EXISTS idx_bookings_payment_status ON public."bookings"("paymentStatus");
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public."bookings"("status");
