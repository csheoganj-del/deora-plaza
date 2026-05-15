import { createClient } from '@supabase/supabase-js';

// Supabase configuration - hardcoded values from your .env file
const supabaseUrl = 'https://wjqsqwitgxqypzbaayos.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcXNxd2l0Z3hxeXB6YmFheW9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM1MjM2MywiZXhwIjoyMDgwOTI4MzYzfQ.0jTsgFT39ZVD-kf9qIMb5zmn281LHR7J_803_gYuofY';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function addMeasurementColumnsDirect() {
  try {
    console.log('Attempting to add measurement columns to menu_items table...');
    
    // Since we can't directly alter tables via the JS client,
    // we'll try to use the RPC function if available
    const { data, error } = await supabase.rpc('execute_sql', {
      sql: `
        ALTER TABLE public.menu_items 
        ADD COLUMN IF NOT EXISTS "measurement" TEXT,
        ADD COLUMN IF NOT EXISTS "measurementUnit" TEXT,
        ADD COLUMN IF NOT EXISTS "baseMeasurement" NUMERIC(10,2);
      `
    });
    
    if (error) {
      console.log('Could not add columns via RPC:', error.message);
      console.log('Please manually run this SQL in your Supabase dashboard:');
      console.log(`
        ALTER TABLE public.menu_items 
        ADD COLUMN IF NOT EXISTS "measurement" TEXT,
        ADD COLUMN IF NOT EXISTS "measurementUnit" TEXT,
        ADD COLUMN IF NOT EXISTS "baseMeasurement" NUMERIC(10,2);
      `);
      return;
    }
    
    console.log('Columns added successfully:', data);
  } catch (error) {
    console.error('Error:', error);
    console.log('Please manually run this SQL in your Supabase dashboard:');
    console.log(`
      ALTER TABLE public.menu_items 
      ADD COLUMN IF NOT EXISTS "measurement" TEXT,
      ADD COLUMN IF NOT EXISTS "measurementUnit" TEXT,
      ADD COLUMN IF NOT EXISTS "baseMeasurement" NUMERIC(10,2);
    `);
  }
}

addMeasurementColumnsDirect();