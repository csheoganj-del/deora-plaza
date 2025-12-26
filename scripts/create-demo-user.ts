#!/usr/bin/env tsx

/**
 * 🔧 Create Demo User
 * 
 * Creates a demo admin user for testing the login system
 */

import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function createDemoUser() {
  console.log('🔧 Creating Demo User');
  console.log('===================');

  // Check environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase environment variables:');
    console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
    console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'Set' : 'Missing');
    return;
  }

  console.log('✅ Environment variables loaded');

  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  try {
    // Check if users table exists
    const { data: tables, error: tablesError } = await supabase
      .from('users')
      .select('id')
      .limit(1);

    if (tablesError) {
      console.error('❌ Users table does not exist or is not accessible:', tablesError.message);
      console.log('💡 You may need to create the users table first.');
      return;
    }

    console.log('✅ Users table is accessible');

    // Check if admin user already exists
    const { data: existingUsers, error: checkError } = await supabase
      .from('users')
      .select('*')
      .eq('username', 'admin');

    if (checkError) {
      console.error('❌ Error checking existing users:', checkError.message);
      return;
    }

    if (existingUsers && existingUsers.length > 0) {
      console.log('⚠️ Admin user already exists!');
      console.log('User details:', {
        id: existingUsers[0].id,
        username: existingUsers[0].username,
        name: existingUsers[0].name,
        role: existingUsers[0].role,
        isActive: existingUsers[0].isActive
      });
      return;
    }

    // Create admin user
    const adminPassword = 'admin123';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);

    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        username: 'admin',
        name: 'System Administrator',
        role: 'super_admin',
        businessUnit: 'all',
        password: hashedPassword,
        authMethod: 'password',
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })
      .select()
      .single();

    if (createError) {
      console.error('❌ Error creating admin user:', createError.message);
      return;
    }

    console.log('✅ Demo admin user created successfully!');
    console.log('');
    console.log('🔑 Login Credentials:');
    console.log('Username: admin');
    console.log('Password: admin123');
    console.log('');
    console.log('🎯 You can now login at: http://localhost:3000/login');

  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

createDemoUser().catch(console.error);