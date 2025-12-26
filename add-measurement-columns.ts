import { createClient } from '@supabase/supabase-js';

// Supabase configuration - hardcoded values from your .env file
const supabaseUrl = 'https://wjqsqwitgxqypzbaayos.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcXNxd2l0Z3hxeXB6YmFheW9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM1MjM2MywiZXhwIjoyMDgwOTI4MzYzfQ.0jTsgFT39ZVD-kf9qIMb5zmn281LHR7J_803_gYuofY';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function addMeasurementColumns() {
  try {
    console.log('Adding measurement columns to menu_items table...');
    
    // Since we can't directly alter tables in Supabase via the JS client,
    // we'll check if the columns exist by attempting to select them
    const { data, error } = await supabase
      .from('menu_items')
      .select('id, measurement, measurementUnit, baseMeasurement')
      .limit(1);
    
    if (error && error.message.includes('column "measurement" does not exist')) {
      console.log('Measurement columns do not exist. Please run the SQL script manually in Supabase dashboard:');
      console.log(`
-- Add measurement columns to menu_items table
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS "measurement" TEXT,
ADD COLUMN IF NOT EXISTS "measurementUnit" TEXT,
ADD COLUMN IF NOT EXISTS "baseMeasurement" NUMERIC(10,2);
      `);
      return;
    }
    
    console.log('Measurement columns already exist or are accessible.');
    console.log('Sample data check:', data?.[0] || 'No data found');
  } catch (error) {
    console.error('Error checking/adding measurement columns:', error);
    console.log('Please run the SQL script manually in Supabase dashboard:');
    console.log(`
-- Add measurement columns to menu_items table
ALTER TABLE public.menu_items 
ADD COLUMN IF NOT EXISTS "measurement" TEXT,
ADD COLUMN IF NOT EXISTS "measurementUnit" TEXT,
ADD COLUMN IF NOT EXISTS "baseMeasurement" NUMERIC(10,2);
    `);
  }
}

addMeasurementColumns();