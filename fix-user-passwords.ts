import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
dotenv.config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

// Create Supabase client with service role key for admin operations
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

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
  },
  
  // ADMIN USER
  {
    username: 'admin',
    email: 'admin@deoraplaza.com',
    password: 'AdminPass123!',
    role: 'super_admin',
    businessUnit: 'all',
    name: 'System Administrator',
    isActive: true
  }
];

async function fixUserPasswords() {
  try {
    console.log('Fixing user passwords...\n');
    
    for (const user of predefinedUsers) {
      console.log(`Updating password for user: ${user.username}`);
      
      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(user.password, saltRounds);
      
      // Update user data in the users table with password
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({
          password: hashedPassword,
          authMethod: 'password',
          updatedAt: new Date().toISOString()
        })
        .eq('email', user.email)
        .select();
      
      if (updateError) {
        console.error(`  ❌ Error updating user ${user.username}:`, updateError.message);
      } else {
        console.log(`  ✅ Password updated for user ${user.username}`);
      }
    }
    
    console.log('\n🎉 All user passwords updated successfully!');
    console.log('\n📋 User Credentials Summary:');
    console.log('=====================================');
    
    predefinedUsers.forEach(user => {
      console.log(`${user.role.toUpperCase()}:`);
      console.log(`  Username: ${user.username}`);
      console.log(`  Password: ${user.password}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

fixUserPasswords();