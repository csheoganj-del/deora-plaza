import dotenv from 'dotenv';
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

async function addMissingAdminToDB() {
  try {
    console.log('Checking for missing users...');
    
    // List auth users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.log('Auth users error:', authError);
      return;
    }
    
    // Check users table
    const { data: dbUsers, error: dbError } = await supabase.from('users').select('*');
    
    if (dbError) {
      console.log('Database users error:', dbError);
      return;
    }
    
    // Create a map of database user IDs for quick lookup
    const dbUserIds = new Set(dbUsers.map(user => user.id));
    
    // Find auth users that don't exist in the database
    const missingUsers = authUsers.users.filter(authUser => !dbUserIds.has(authUser.id));
    
    console.log(`Found ${missingUsers.length} missing users:`);
    
    for (const user of missingUsers) {
      console.log(`- ${user.email} (${user.id})`);
      
      // Extract metadata if available
      const metadata = user.user_metadata || {};
      
      // Determine role based on email pattern (similar to the hook logic)
      let role = 'waiter';
      let businessUnit = 'cafe';
      let username = user.email?.split('@')[0] || user.email || 'User';
      
      if (user.email?.includes('kalpeshdeora')) {
        role = 'super_admin';
        businessUnit = 'all';
        username = 'kalpeshdeora';
      } else if (user.email?.includes('owner')) {
        role = 'owner';
        businessUnit = 'all';
        username = 'business_owner';
      } else if (user.email?.includes('cafe.manager')) {
        role = 'cafe_manager';
        businessUnit = 'cafe';
        username = 'cafe_manager';
      } else if (user.email?.includes('chef.kitchen')) {
        role = 'kitchen';
        businessUnit = 'cafe';
        username = 'kitchen_chef';
      } else if (user.email?.includes('rahul.waiter')) {
        role = 'waiter';
        businessUnit = 'cafe';
        username = 'waiter_rahul';
      } else if (user.email?.includes('priya.waiter')) {
        role = 'waiter';
        businessUnit = 'cafe';
        username = 'waiter_priya';
      } else if (user.email?.includes('bar.manager')) {
        role = 'bar_manager';
        businessUnit = 'bar';
        username = 'bar_manager';
      } else if (user.email?.includes('sam.bartender')) {
        role = 'bartender';
        businessUnit = 'bar';
        username = 'bartender_sam';
      } else if (user.email?.includes('hotel.manager')) {
        role = 'hotel_manager';
        businessUnit = 'hotel';
        username = 'hotel_manager';
      } else if (user.email?.includes('reception.hotel')) {
        role = 'hotel_reception';
        businessUnit = 'hotel';
        username = 'hotel_reception';
      } else if (user.email?.includes('garden.manager')) {
        role = 'garden_manager';
        businessUnit = 'garden';
        username = 'garden_manager';
      } else if (user.email?.includes('admin')) {
        role = 'super_admin';
        businessUnit = 'all';
        username = 'admin';
      }
      
      // Insert the missing user into the database
      const { data: insertedUser, error: insertError } = await supabase
        .from('users')
        .upsert([
          {
            id: user.id,
            username: metadata.username || username,
            email: user.email,
            role: metadata.role || role,
            businessUnit: metadata.businessUnit || businessUnit,
            name: metadata.name || username,
            isActive: true,
            createdAt: user.created_at,
            updatedAt: new Date().toISOString()
          }
        ], {
          onConflict: 'email'
        })
        .select();
      
      if (insertError) {
        console.error(`  ❌ Error inserting user ${user.email}:`, insertError.message);
      } else {
        console.log(`  ✅ User ${user.email} added to database`);
      }
    }
    
    if (missingUsers.length === 0) {
      console.log('All auth users are present in the database.');
    }
    
  } catch (error) {
    console.error('Error adding missing users:', error);
  }
}

addMissingAdminToDB();