import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';

// Supabase configuration - hardcoded values from your .env file
const supabaseUrl = 'https://wjqsqwitgxqypzbaayos.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcXNxd2l0Z3hxeXB6YmFheW9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM1MjM2MywiZXhwIjoyMDgwOTI4MzYzfQ.0jTsgFT39ZVD-kf9qIMb5zmn281LHR7J_803_gYuofY';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Template for user data structure - replace with your actual Firebase user data
interface FirebaseUser {
  uid: string;
  email: string;
  displayName: string;
  phoneNumber?: string;
  disabled: boolean;
  // Add any other fields you had in Firebase
}

// Template for your existing users - replace with actual data from Firebase
const firebaseUsers: FirebaseUser[] = [
  // Example users - replace with your actual Firebase user data
  {
    uid: 'user1_uid',
    email: 'admin@deoraplaza.com',
    displayName: 'System Administrator',
    phoneNumber: '+1234567890',
    disabled: false
  },
  {
    uid: 'user2_uid',
    email: 'manager@deoraplaza.com',
    displayName: 'Restaurant Manager',
    phoneNumber: '+1234567891',
    disabled: false
  },
  // Add more users as needed
];

async function migrateUsersFromFirebase() {
  console.log('Starting user migration from Firebase to Supabase...');
  
  for (const firebaseUser of firebaseUsers) {
    try {
      console.log(`Migrating user: ${firebaseUser.email}`);
      
      // Create auth user in Supabase
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: firebaseUser.email,
        password: 'TemporaryPassword123!', // Set a temporary password
        email_confirm: true,
        user_metadata: {
          username: firebaseUser.email.split('@')[0],
          name: firebaseUser.displayName,
          phoneNumber: firebaseUser.phoneNumber,
          role: 'waiter', // Default role - adjust as needed
          businessUnit: 'cafe' // Default business unit - adjust as needed
        }
      });

      if (authError) {
        if (authError.message.includes('already exists')) {
          console.log(`User ${firebaseUser.email} already exists in Supabase auth`);
        } else {
          console.error(`Error creating auth user ${firebaseUser.email}:`, authError.message);
          continue;
        }
      } else {
        console.log(`Created auth user for ${firebaseUser.email}:`, authUser.user.id);
      }

      // Insert user data into users table
      const { data: userData, error: userError } = await supabase
        .from('users')
        .upsert([
          {
            id: authUser?.user?.id || '', // Use existing ID if user already existed
            username: firebaseUser.email.split('@')[0],
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            phoneNumber: firebaseUser.phoneNumber,
            role: 'waiter', // Default role - adjust as needed
            businessUnit: 'cafe', // Default business unit - adjust as needed
            isActive: !firebaseUser.disabled,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ], {
          onConflict: 'email'
        })
        .select();

      if (userError) {
        console.error(`Error inserting user data for ${firebaseUser.email}:`, userError.message);
      } else {
        console.log(`Inserted user data for ${firebaseUser.email}:`, userData);
      }

    } catch (error) {
      console.error(`Unexpected error migrating user ${firebaseUser.email}:`, error);
    }
  }

  console.log('User migration completed!');
  console.log('\nNext steps:');
  console.log('1. Users have been created with temporary passwords');
  console.log('2. Users will need to reset their passwords on first login');
  console.log('3. You may need to adjust roles and business units for each user');
}

// Run the migration
migrateUsersFromFirebase();