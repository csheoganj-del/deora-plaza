import { createClient } from '@supabase/supabase-js';

// Supabase configuration - hardcoded values from your .env file
const supabaseUrl = 'https://wjqsqwitgxqypzbaayos.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcXNxd2l0Z3hxeXB6YmFheW9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM1MjM2MywiZXhwIjoyMDgwOTI4MzYzfQ.0jTsgFT39ZVD-kf9qIMb5zmn281LHR7J_803_gYuofY';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function refreshSchemaAndPopulate() {
  try {
    console.log('Refreshing schema cache...');
    
    // Test accessing the measurement columns
    const { data, error } = await supabase
      .from('menu_items')
      .select('id, name, measurement, measurementUnit, baseMeasurement')
      .limit(1);
    
    if (error) {
      console.error('Error accessing menu_items table:', error.message);
      return;
    }
    
    console.log('Schema cache refreshed successfully.');
    console.log('Sample data:', data?.[0] || 'No data found');
    
    // Now run the populate script
    console.log('Running populate bar menu script...');
    await import('./populate-bar-menu');
  } catch (error) {
    console.error('Error:', error);
  }
}

refreshSchemaAndPopulate();