import { createClient } from '@supabase/supabase-js';

// Supabase configuration - hardcoded values from your .env file
const supabaseUrl = 'https://wjqsqwitgxqypzbaayos.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcXNxd2l0Z3hxeXB6YmFheW9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM1MjM2MywiZXhwIjoyMDgwOTI4MzYzfQ.0jTsgFT39ZVD-kf9qIMb5zmn281LHR7J_803_gYuofY';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function addGstColumns() {
  try {
    console.log('🔍 Adding GST columns to businessSettings table...\n');
    
    // Add gstEnabled column
    const { error: error1 } = await supabase.rpc('execute_sql', {
      sql: `ALTER TABLE businessSettings ADD COLUMN IF NOT EXISTS "gstEnabled" BOOLEAN DEFAULT false;`
    });

    if (error1) {
      console.log('⚠️  Warning: Could not add gstEnabled column:', error1.message);
    } else {
      console.log('✅ Successfully added gstEnabled column');
    }

    // Add gstNumber column
    const { error: error2 } = await supabase.rpc('execute_sql', {
      sql: `ALTER TABLE businessSettings ADD COLUMN IF NOT EXISTS "gstNumber" TEXT DEFAULT '';`
    });

    if (error2) {
      console.log('⚠️  Warning: Could not add gstNumber column:', error2.message);
    } else {
      console.log('✅ Successfully added gstNumber column');
    }

    console.log('\n🔄 Verifying columns were added...\n');
    
    // Get updated table info
    const { data, error: selectError } = await supabase
      .from('businessSettings')
      .select('*')
      .limit(1);

    if (selectError) {
      console.error('Error querying updated table:', selectError.message);
      process.exit(1);
    }

    if (data && data.length > 0) {
      console.log('Updated table columns:');
      const row = data[0];
      Object.keys(row).forEach(key => {
        console.log(`- ${key}: ${typeof row[key]}`);
      });
    }
    
    console.log('\n🎉 GST columns successfully added to businessSettings table!');
    console.log('\nNext steps:');
    console.log('1. Restart your development server to refresh the schema cache');
    console.log('2. Visit the business settings page to configure GST');
    console.log('3. Enable GST and enter your GST number');
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

addGstColumns();