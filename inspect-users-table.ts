import { createClient } from '@supabase/supabase-js';

// Supabase configuration - hardcoded values from your .env file
const supabaseUrl = 'https://wjqsqwitgxqypzbaayos.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcXNxd2l0Z3hxeXB6YmFheW9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM1MjM2MywiZXhwIjoyMDgwOTI4MzYzfQ.0jTsgFT39ZVD-kf9qIMb5zmn281LHR7J_803_gYuofY';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function inspectUsersTable() {
  try {
    console.log('🔍 Inspecting users table structure...\n');
    
    // Try a simple insert with minimal fields to see what columns are recognized
    console.log('Testing with minimal user data...');
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          username: 'test_inspect_user'
        }
      ])
      .select();
      
    if (error) {
      console.log('❌ Minimal insert failed:', error.message);
      
      // Let's try to understand what columns might exist by trying different combinations
      console.log('\nTrying with just username and email...');
      const { data: data2, error: error2 } = await supabase
        .from('users')
        .insert([
          {
            username: 'test_inspect_user2',
            email: 'test2@example.com'
          }
        ])
        .select();
        
      if (error2) {
        console.log('❌ Username + email insert failed:', error2.message);
      } else {
        console.log('✅ Username + email insert succeeded');
        console.log('Returned data keys:', Object.keys(data2[0] || {}));
        // Clean up
        await supabase.from('users').delete().eq('username', 'test_inspect_user2');
      }
    } else {
      console.log('✅ Minimal insert succeeded');
      console.log('Returned data keys:', Object.keys(data[0] || {}));
      // Clean up
      await supabase.from('users').delete().eq('username', 'test_inspect_user');
    }
    
    console.log('\n📋 Recommendation:');
    console.log('The users table schema appears to be incorrect.');
    console.log('You should drop and recreate all tables using the supabase-table-setup.sql script.');
    
  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

inspectUsersTable();