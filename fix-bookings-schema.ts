// Script to fix missing columns in the bookings table
const missingColumnsSQL = `
-- Add missing columns to the bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS "bookingNumber" TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS "customerName" TEXT,
ADD COLUMN IF NOT EXISTS "roomNumber" TEXT,
ADD COLUMN IF NOT EXISTS "roomServiceTotal" NUMERIC(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS "roomServiceCharges" JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS "receiptNumber" TEXT;
`;

console.log('SQL to fix bookings schema:');
console.log(missingColumnsSQL);

// Instructions for the user
console.log('\nTo apply these changes:');
console.log('1. Go to your Supabase project dashboard');
console.log('2. Navigate to SQL Editor');
console.log('3. Paste the above SQL and run it');
console.log('4. After running, restart your Supabase project or refresh the schema cache');