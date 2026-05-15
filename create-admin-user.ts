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

async function createAdminUser() {
  try {
    console.log('Creating admin user...');
    
    // First, try to create the auth user
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@deoraplaza.com',
      password: 'AdminPass123!',
      email_confirm: true,
      user_metadata: {
        username: 'admin',
        role: 'super_admin',
        businessUnit: 'all'
      }
    });

    let userId: string;
    
    if (authError) {
      // If user already exists, we'll try to update it
      if (authError.message.includes('already exists')) {
        console.log('User already exists, proceeding with database insert...');
        // In a real scenario, you would fetch the existing user ID
        // For now, we'll use a placeholder
        userId = 'placeholder-id'; // You'll need to replace this with the actual user ID
      } else {
        console.error('Error creating auth user:', authError.message);
        process.exit(1);
      }
    } else {
      console.log('Auth user created successfully:', authUser.user.id);
      userId = authUser.user.id;
    }

    // Insert/update user data in the users table
    const { data: userData, error: userError } = await supabase
      .from('users')
      .upsert([
        {
          id: userId,
          username: 'admin',
          email: 'admin@deoraplaza.com',
          role: 'super_admin',
          businessUnit: 'all',
          name: 'System Administrator',
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ], {
        onConflict: 'email'
      })
      .select();

    if (userError) {
      console.error('Error inserting user data:', userError.message);
      console.log('Please make sure the users table exists in your Supabase database.');
      console.log('You can create it by running the SQL commands in supabase-table-setup.sql');
    } else {
      console.log('User data inserted successfully:', userData);
    }

    console.log('Admin user setup completed!');
    console.log('Login credentials:');
    console.log('Email: admin@deoraplaza.com');
    console.log('Password: AdminPass123!');
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

createAdminUser();