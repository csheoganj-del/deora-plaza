import { createClient } from '@supabase/supabase-js';

// Supabase configuration - hardcoded values from your .env file
const supabaseUrl = 'https://wjqsqwitgxqypzbaayos.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcXNxd2l0Z3hxeXB6YmFheW9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM1MjM2MywiZXhwIjoyMDgwOTI4MzYzfQ.0jTsgFT39ZVD-kf9qIMb5zmn281LHR7J_803_gYuofY';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Predefined users with their roles and business units
const predefinedUsers = [
  // SUPER ADMIN (System Owner)
  {
    username: 'kalpeshdeora',
    email: 'kalpeshdeora@deoraplaza.com',
    password: 'Kalpesh!1006',
    role: 'super_admin',
    businessUnit: 'all',
    name: 'Kalpesh Deora',
    isActive: true
  },
  
  // OWNER (Business Partner)
  {
    username: 'business_owner',
    email: 'owner@deoraplaza.com',
    password: 'OwnerPass123',
    role: 'owner',
    businessUnit: 'all',
    name: 'Business Owner',
    isActive: true
  },
  
  // CAFE & RESTAURANT TEAM
  {
    username: 'cafe_manager',
    email: 'cafe.manager@deoraplaza.com',
    password: 'ManageCafe123',
    role: 'cafe_manager',
    businessUnit: 'cafe',
    name: 'Cafe Manager',
    isActive: true
  },
  {
    username: 'waiter_rahul',
    email: 'rahul.waiter@deoraplaza.com',
    password: 'ServeTables123',
    role: 'waiter',
    businessUnit: 'cafe',
    name: 'Waiter Rahul',
    isActive: true
  },
  {
    username: 'waiter_priya',
    email: 'priya.waiter@deoraplaza.com',
    password: 'ServeTables123',
    role: 'waiter',
    businessUnit: 'cafe',
    name: 'Waiter Priya',
    isActive: true
  },
  {
    username: 'kitchen_chef',
    email: 'chef.kitchen@deoraplaza.com',
    password: 'CookFood123',
    role: 'kitchen',
    businessUnit: 'cafe',
    name: 'Kitchen Chef',
    isActive: true
  },
  
  // BAR TEAM
  {
    username: 'bar_manager',
    email: 'bar.manager@deoraplaza.com',
    password: 'ManageBar123',
    role: 'bar_manager',
    businessUnit: 'bar',
    name: 'Bar Manager',
    isActive: true
  },
  {
    username: 'bartender_sam',
    email: 'sam.bartender@deoraplaza.com',
    password: 'ServeDrinks123',
    role: 'bartender',
    businessUnit: 'bar',
    name: 'Bartender Sam',
    isActive: true
  },
  
  // HOTEL TEAM
  {
    username: 'hotel_manager',
    email: 'hotel.manager@deoraplaza.com',
    password: 'ManageHotel123',
    role: 'hotel_manager',
    businessUnit: 'hotel',
    name: 'Hotel Manager',
    isActive: true
  },
  {
    username: 'hotel_reception',
    email: 'reception.hotel@deoraplaza.com',
    password: 'CheckIn123',
    role: 'hotel_reception',
    businessUnit: 'hotel',
    name: 'Hotel Reception',
    isActive: true
  },
  
  // GARDEN TEAM
  {
    username: 'garden_manager',
    email: 'garden.manager@deoraplaza.com',
    password: 'ManageGarden123',
    role: 'garden_manager',
    businessUnit: 'garden',
    name: 'Garden Manager',
    isActive: true
  }
];

async function createPredefinedUsers() {
  try {
    console.log('Creating predefined users...\n');
    
    for (const user of predefinedUsers) {
      console.log(`Creating user: ${user.username} (${user.role})`);
      
      // Create auth user
      const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true,
        user_metadata: {
          username: user.username,
          role: user.role,
          businessUnit: user.businessUnit,
          name: user.name
        }
      });
      
      if (authError) {
        if (authError.message.includes('already exists')) {
          console.log(`  ⚠️  User ${user.username} already exists in auth system`);
        } else {
          console.error(`  ❌ Error creating auth user ${user.username}:`, authError.message);
          continue;
        }
      } else {
        console.log(`  ✅ Auth user created: ${authUser.user.id}`);
      }
      
      // Insert user data into users table
      const userId = authUser?.user?.id || 'unknown';
      const { data: userData, error: userError } = await supabase
        .from('users')
        .upsert([
          {
            id: userId,
            username: user.username,
            email: user.email,
            role: user.role,
            businessUnit: user.businessUnit,
            name: user.name,
            isActive: user.isActive,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ], {
          onConflict: 'email'
        })
        .select();
      
      if (userError) {
        console.error(`  ❌ Error inserting user data for ${user.username}:`, userError.message);
      } else {
        console.log(`  ✅ User data inserted`);
      }
      
      console.log('');
    }
    
    console.log('🎉 All predefined users created successfully!');
    console.log('\n📋 User Credentials Summary:');
    console.log('=====================================');
    
    predefinedUsers.forEach(user => {
      console.log(`${user.role.toUpperCase()}:`);
      console.log(`  Username: ${user.username}`);
      console.log(`  Password: ${user.password}`);
      console.log('');
    });
    
    console.log('\n🔐 Security Notes:');
    console.log('==================');
    console.log('1. Please change these default passwords after first login');
    console.log('2. Store these credentials securely');
    console.log('3. Consider implementing password expiration policies');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

createPredefinedUsers();