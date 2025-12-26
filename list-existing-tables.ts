import { createClient } from '@supabase/supabase-js';

// Supabase configuration - hardcoded values from your .env file
const supabaseUrl = 'https://wjqsqwitgxqypzbaayos.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcXNxd2l0Z3hxeXB6YmFheW9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM1MjM2MywiZXhwIjoyMDgwOTI4MzYzfQ.0jTsgFT39ZVD-kf9qIMb5zmn281LHR7J_803_gYuofY';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function listExistingTables() {
  try {
    console.log('🔍 Listing all existing tables...\n');
    
    // Try to get list of tables from pg_tables
    const { data, error } = await supabase
      .rpc('execute_sql', { 
        sql: "SELECT tablename FROM pg_tables WHERE schemaname = 'public'" 
      });
      
    if (error) {
      console.log('Error getting table list:', error.message);
      // Fallback: try a different approach
      console.log('\nTrying alternative approach...\n');
      
      // Try to select from information_schema
      const { data: infoData, error: infoError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');
        
      if (infoError) {
        console.log('Alternative approach also failed:', infoError.message);
        return;
      }
      
      console.log('Tables found:');
      infoData.forEach((row: any) => {
        console.log(`  - ${row.table_name}`);
      });
    } else {
      console.log('Tables found:');
      data.forEach((row: any) => {
        console.log(`  - ${row.tablename}`);
      });
    }
    
  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

listExistingTables();