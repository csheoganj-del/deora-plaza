import { createClient } from '@supabase/supabase-js';

// Supabase configuration - hardcoded values from your .env file
const supabaseUrl = 'https://wjqsqwitgxqypzbaayos.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcXNxd2l0Z3hxeXB6YmFheW9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM1MjM2MywiZXhwIjoyMDgwOTI4MzYzfQ.0jTsgFT39ZVD-kf9qIMb5zmn281LHR7J_803_gYuofY';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function setupBusinessSettingsTable() {
  try {
    console.log('🔧 Setting up businessSettings table...\n');
    
    // Since we can't execute raw SQL through the client, we'll provide the SQL commands
    // that need to be run in the Supabase SQL editor
    
    console.log('Please run the following SQL commands in your Supabase SQL editor:\n');
    
    console.log(`
-- Create businessSettings table with all required columns
CREATE TABLE IF NOT EXISTS public."businessSettings" (
    "id" TEXT PRIMARY KEY DEFAULT 'default',
    "name" TEXT,
    "address" TEXT,
    "mobile" TEXT,
    "waiterlessMode" BOOLEAN DEFAULT false,
    "enablePasswordProtection" BOOLEAN DEFAULT true,
    "gstEnabled" BOOLEAN DEFAULT false,
    "gstPercentage" NUMERIC(5,2) DEFAULT 0, // Changed from gstNumber to gstPercentage
    -- Per-unit GST settings
    "barGstEnabled" BOOLEAN DEFAULT false,
    "barGstPercentage" NUMERIC(5,2) DEFAULT 0,
    "cafeGstEnabled" BOOLEAN DEFAULT false,
    "cafeGstPercentage" NUMERIC(5,2) DEFAULT 0,
    "hotelGstEnabled" BOOLEAN DEFAULT false,
    "hotelGstPercentage" NUMERIC(5,2) DEFAULT 0,
    "gardenGstEnabled" BOOLEAN DEFAULT false,
    "gardenGstPercentage" NUMERIC(5,2) DEFAULT 0,
    -- Per-unit waiterless mode settings
    "barWaiterlessMode" BOOLEAN DEFAULT false,
    "cafeWaiterlessMode" BOOLEAN DEFAULT false,
    "hotelWaiterlessMode" BOOLEAN DEFAULT false,
    "gardenWaiterlessMode" BOOLEAN DEFAULT false,
    "enableBarModule" BOOLEAN DEFAULT true,
    "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

// Add comments for clarity
COMMENT ON TABLE public."businessSettings" IS 'Business configuration settings';
COMMENT ON COLUMN public."businessSettings"."waiterlessMode" IS 'Enable direct billing without kitchen flow';
COMMENT ON COLUMN public."businessSettings"."gstEnabled" IS 'Enable GST tax calculation';
COMMENT ON COLUMN public."businessSettings"."gstPercentage" IS 'Default GST percentage for billing calculations'; // Updated comment
COMMENT ON COLUMN public."businessSettings"."barGstEnabled" IS 'Enable GST for bar unit';
COMMENT ON COLUMN public."businessSettings"."barGstPercentage" IS 'GST percentage for bar unit';
COMMENT ON COLUMN public."businessSettings"."cafeGstEnabled" IS 'Enable GST for cafe unit';
COMMENT ON COLUMN public."businessSettings"."cafeGstPercentage" IS 'GST percentage for cafe unit';
COMMENT ON COLUMN public."businessSettings"."hotelGstEnabled" IS 'Enable GST for hotel unit';
COMMENT ON COLUMN public."businessSettings"."hotelGstPercentage" IS 'GST percentage for hotel unit';
COMMENT ON COLUMN public."businessSettings"."gardenGstEnabled" IS 'Enable GST for garden unit';
COMMENT ON COLUMN public."businessSettings"."gardenGstPercentage" IS 'GST percentage for garden unit';
COMMENT ON COLUMN public."businessSettings"."enableBarModule" IS 'Enable/disable the bar module functionality';

-- Insert default record if it doesn't exist
INSERT INTO public."businessSettings" ("id", "name", "address", "mobile", "waiterlessMode", "enablePasswordProtection", "gstEnabled", "gstPercentage", "barGstEnabled", "barGstPercentage", "cafeGstEnabled", "cafeGstPercentage", "hotelGstEnabled", "hotelGstPercentage", "gardenGstEnabled", "gardenGstPercentage", "barWaiterlessMode", "cafeWaiterlessMode", "hotelWaiterlessMode", "gardenWaiterlessMode", "enableBarModule", "createdAt", "updatedAt")
VALUES (
    'default',
    'Deora Plaza',
    '123 Hospitality Street, City, State 12345',
    '+1234567890',
    false,
    true,
    false,
    0, // Changed from empty string to 0
    false,
    0,
    false,
    0,
    false,
    0,
    false,
    0,
    false, // barWaiterlessMode
    false, // cafeWaiterlessMode
    false, // hotelWaiterlessMode
    false, // gardenWaiterlessMode
    true,
    NOW(),
    NOW()
)
ON CONFLICT ("id") DO UPDATE SET
    "updatedAt" = NOW();

-- Grant permissions
GRANT ALL ON TABLE public."businessSettings" TO anon;
GRANT ALL ON TABLE public."businessSettings" TO authenticated;
GRANT ALL ON TABLE public."businessSettings" TO service_role;
    `);
    
    console.log('\n✅ Once you run these commands, the businessSettings table will be properly set up.');
    console.log('\nNext steps:');
    console.log('1. Run the SQL commands above in your Supabase SQL editor');
    console.log('2. Restart your development server to refresh the schema cache');
    
  } catch (error) {
    console.error('❌ Error setting up businessSettings table:', error);
    process.exit(1);
  }
}

setupBusinessSettingsTable();