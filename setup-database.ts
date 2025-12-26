import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function setupDatabase() {
  try {
    console.log('Attempting to insert user data directly...');
    
    // Try to insert the user data directly
    const { data, error } = await supabase
      .from('users')
      .insert([
        {
          username: 'admin',
          email: 'admin@deoraplaza.com',
          role: 'super_admin',
          businessUnit: 'all',
          name: 'System Administrator',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ])
      .select();

    if (error) {
      console.error('Error inserting user data:', error.message);
      console.log('This is expected if the table does not exist yet.');
      console.log('Please create the users table in your Supabase dashboard manually:');
      console.log('1. Go to your Supabase project dashboard');
      console.log('2. Navigate to Table Editor');
      console.log('3. Create a new table named "users" with these columns:');
      console.log('   - id (UUID, Primary Key, Default: gen_random_uuid())');
      console.log('   - username (Text, Unique, Not Null)');
      console.log('   - email (Text, Unique)');
      console.log('   - role (Text, Default: waiter)');
      console.log('   - businessUnit (Text, Default: cafe)');
      console.log('   - name (Text)');
      console.log('   - isActive (Boolean, Default: true)');
      console.log('   - createdAt (Timestamp, Default: now())');
      console.log('   - updatedAt (Timestamp, Default: now())');
    } else {
      console.log('User data inserted successfully:', data);
    }

    console.log('\nAfter creating the table, run the create-admin-user.ts script again.');
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

setupDatabase();