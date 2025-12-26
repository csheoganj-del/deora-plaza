import { createClient } from '@supabase/supabase-js';

// Supabase configuration - hardcoded values from your .env file
const supabaseUrl = 'https://wjqsqwitgxqypzbaayos.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcXNxd2l0Z3hxeXB6YmFheW9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM1MjM2MywiZXhwIjoyMDgwOTI4MzYzfQ.0jTsgFT39ZVD-kf9qIMb5zmn281LHR7J_803_gYuofY';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function addGstColumnsToExistingTable() {
  try {
    console.log('🔧 Adding missing GST columns to existing businessSettings table...\n');
    
    // Since we can't execute raw SQL through the client, we'll provide the SQL commands
    // that need to be run in the Supabase SQL editor
    
    console.log('Please run the following SQL commands in your Supabase SQL editor:\n');
    
    console.log(`
-- Add missing GST columns to existing businessSettings table
ALTER TABLE public."businessSettings" 
ADD COLUMN IF NOT EXISTS "gstEnabled" BOOLEAN DEFAULT false;

ALTER TABLE public."businessSettings" 
ADD COLUMN IF NOT EXISTS "gstNumber" TEXT DEFAULT '';

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'businessSettings' 
AND column_name IN ('gstEnabled', 'gstNumber');
    `);
    
    console.log('\n✅ Once you run these commands, the GST columns will be added to your existing businessSettings table.');
    console.log('\nNext steps:');
    console.log('1. Run the SQL commands above in your Supabase SQL editor');
    console.log('2. Restart your development server to refresh the schema cache');
    console.log('3. Visit the business settings page to configure GST settings');
    console.log('4. Enable GST and enter your GST number');
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

addGstColumnsToExistingTable();