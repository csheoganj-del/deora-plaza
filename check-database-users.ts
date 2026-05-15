#!/usr/bin/env tsx

/**
 * Check what users exist in the Supabase database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function checkDatabaseUsers() {
  console.log('🔍 Checking users in Supabase database...');
  
  // Get Supabase credentials
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }
  
  console.log('📍 Supabase URL:', supabaseUrl);
  
  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Check if users table exists and get all users
    console.log('📋 Fetching all users from database...');
    
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, email, role, business_unit, name, is_active, created_at')
      .order('created_at', { ascending: false });
    
    if (error) {
      console.error('❌ Error fetching users:', error.message);
      
      if (error.message.includes('relation "users" does not exist')) {
        console.log('\n💡 The users table does not exist yet.');
        console.log('You need to create the database schema first.');
        console.log('Run the SQL script in your Supabase SQL Editor:');
        console.log('📄 supabase-complete-schema.sql');
        return;
      }
      
      process.exit(1);
    }
    
    if (!users || users.length === 0) {
      console.log('📭 No users found in the database.');
      console.log('\n💡 You need to create an admin user first.');
      console.log('Run: tsx create-real-supabase-admin.ts');
      return;
    }
    
    console.log(`\n✅ Found ${users.length} user(s) in the database:\n`);
    
    users.forEach((user, index) => {
      console.log(`${index + 1}. 👤 ${user.name || 'No Name'}`);
      console.log(`   📧 Email: ${user.email}`);
      console.log(`   👤 Username: ${user.username}`);
      console.log(`   🎯 Role: ${user.role}`);
      console.log(`   🏢 Business Unit: ${user.business_unit}`);
      console.log(`   ✅ Active: ${user.is_active ? 'Yes' : 'No'}`);
      console.log(`   📅 Created: ${new Date(user.created_at).toLocaleDateString()}`);
      console.log('');
    });
    
    // Show login instructions
    const adminUsers = users.filter(u => u.role === 'super_admin' || u.role === 'owner');
    
    if (adminUsers.length > 0) {
      console.log('🔐 Admin Login Options:');
      adminUsers.forEach(admin => {
        console.log(`   • Username: ${admin.username} (or Email: ${admin.email})`);
        console.log(`   • Password: [You need to know the password you set]`);
      });
      console.log('\n🌐 Login at: http://localhost:3000/login');
    } else {
      console.log('⚠️ No admin users found. You may need to create one.');
    }
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  }
}

// Run the script
checkDatabaseUsers()
  .then(() => {
    console.log('\n✨ Database check completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Check failed:', error);
    process.exit(1);
  });