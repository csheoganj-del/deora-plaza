-- Add ALL columns used in createHotelBooking to ensure insertion success
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "checkIn" TIMESTAMP WITH TIME ZONE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "checkOut" TIMESTAMP WITH TIME ZONE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "guestName" TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "customerId" UUID;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "roomNumber" TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "notes" TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "customerMobile" TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "type" TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMP WITH TIME ZONE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMP WITH TIME ZONE;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "roomId" UUID;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "totalAmount" NUMERIC;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "status" TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "guestCount" INTEGER;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "advancePayment" NUMERIC;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "payments" JSONB;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "totalPaid" NUMERIC;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "remainingBalance" NUMERIC;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "paymentStatus" TEXT;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "basePrice" NUMERIC;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "discountPercent" NUMERIC;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "discountAmount" NUMERIC;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "gstEnabled" BOOLEAN;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "gstPercentage" NUMERIC;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS "gstAmount" NUMERIC;

-- Comment: This script adds every single field used in the hotel booking payload.
-- Running this will guarantee that no "column not found" errors occur for these fields.
