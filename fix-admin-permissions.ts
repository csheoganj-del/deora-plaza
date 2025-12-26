import { createClient } from '@supabase/supabase-js';

// Supabase configuration - hardcoded values from your .env file
const supabaseUrl = 'https://wjqsqwitgxqypzbaayos.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcXNxd2l0Z3hxeXB6YmFheW9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM1MjM2MywiZXhwIjoyMDgwOTI4MzYzfQ.0jTsgFT39ZVD-kf9qIMb5zmn281LHR7J_803_gYuofY';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function fixAdminPermissions() {
  try {
    console.log('🔧 Fixing admin permissions...\n');
    
    // Ensure the admin user has the correct role and permissions
    const { data, error } = await supabase
      .from('users')
      .update({
        role: 'super_admin',
        businessUnit: 'all',
        isActive: true,
        updatedAt: new Date().toISOString()
      })
      .eq('username', 'kalpeshdeora')
      .select();

    if (error) {
      console.error('❌ Error updating admin user:', error.message);
      process.exit(1);
    }

    if (data && data.length > 0) {
      console.log('✅ Admin user permissions fixed successfully!');
      console.log(`  - Username: ${data[0].username}`);
      console.log(`  - Role: ${data[0].role}`);
      console.log(`  - Business Unit: ${data[0].businessUnit}`);
      console.log(`  - Active: ${data[0].isActive ? 'Yes' : 'No'}`);
    } else {
      console.log('⚠️ Admin user not found. Creating new admin user...');
      
      // Create the admin user if it doesn't exist
      const { data: newData, error: newError } = await supabase
        .from('users')
        .insert([
          {
            username: 'kalpeshdeora',
            email: 'kalpeshdeora@deoraplaza.com',
            role: 'super_admin',
            businessUnit: 'all',
            name: 'Kalpesh Deora',
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ])
        .select();

      if (newError) {
        console.error('❌ Error creating admin user:', newError.message);
        process.exit(1);
      }

      if (newData && newData.length > 0) {
        console.log('✅ New admin user created successfully!');
        console.log(`  - Username: ${newData[0].username}`);
        console.log(`  - Role: ${newData[0].role}`);
        console.log(`  - Business Unit: ${newData[0].businessUnit}`);
      }
    }

    console.log('\n📋 Login credentials:');
    console.log('Username: kalpeshdeora');
    console.log('Password: Kalpesh!1006');
    console.log('\nPlease log out and log back in with these credentials to see the full navigation.');
    
  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

fixAdminPermissions();