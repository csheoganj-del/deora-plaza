// Script to fix missing columns in the customers table
const missingCustomerColumnsSQL = `
-- Add missing columns to the customers table
ALTER TABLE public.customers 
ADD COLUMN IF NOT EXISTS "lastVisit" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "discountTier" TEXT DEFAULT 'none',
ADD COLUMN IF NOT EXISTS "customDiscountPercent" NUMERIC(5,2) DEFAULT 0;
`;

console.log('SQL to fix customers schema:');
console.log(missingCustomerColumnsSQL);

// Instructions for the user
console.log('\nTo apply these changes:');
console.log('1. Go to your Supabase project dashboard');
console.log('2. Navigate to SQL Editor');
console.log('3. Paste the above SQL and run it');
console.log('4. After running, restart your Supabase project or refresh the schema cache');