#!/usr/bin/env tsx

/**
 * Create Admin User in Real Supabase Database
 * Run this after setting up your real Supabase credentials
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function createRealSupabaseAdmin() {
  console.log('🚀 Creating admin user in real Supabase database...');
  
  // Get Supabase credentials
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials in .env.local file');
    console.log('Please update your .env.local file with:');
    console.log('NEXT_PUBLIC_SUPABASE_URL=your_project_url');
    console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_role_key');
    process.exit(1);
  }
  
  if (supabaseUrl.includes('demo-project') || supabaseServiceKey.includes('demo')) {
    console.error('❌ You are still using demo credentials!');
    console.log('Please replace the demo credentials with your real Supabase credentials');
    process.exit(1);
  }
  
  console.log('✅ Using real Supabase credentials');
  console.log('📍 Supabase URL:', supabaseUrl);
  
  // Create Supabase client
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // Test connection
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Failed to connect to Supabase:', testError.message);
      console.log('Please check:');
      console.log('1. Your Supabase project is active');
      console.log('2. Your credentials are correct');
      console.log('3. You have run the database schema setup');
      process.exit(1);
    }
    
    console.log('✅ Successfully connected to Supabase');
    
    // Check if admin already exists
    const { data: existingAdmin, error: checkError } = await supabase
      .from('users')
      .select('id, username, role')
      .eq('role', 'super_admin')
      .limit(1);
    
    if (checkError) {
      console.error('❌ Error checking existing admin:', checkError.message);
      process.exit(1);
    }
    
    if (existingAdmin && existingAdmin.length > 0) {
      console.log('ℹ️ Super admin already exists:', existingAdmin[0]);
      console.log('📧 Try logging in with existing admin credentials');
      return;
    }
    
    // Create admin user
    const adminPassword = 'Admin@123!';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    const adminUser = {
      username: 'admin',
      email: 'admin@deoraplaza.com',
      phone_number: '+91-9999999999',
      password: hashedPassword,
      auth_method: 'password',
      role: 'super_admin',
      business_unit: 'all',
      name: 'System Administrator',
      permissions: [
        'view_dashboard', 'view_analytics', 'export_reports',
        'manage_business_units', 'manage_orders', 'manage_inventory',
        'manage_customers', 'manage_staff', 'view_kds', 'manage_kds',
        'create_bookings', 'manage_rooms', 'manage_events',
        'view_feedback', 'manage_feedback'
      ],
      is_active: true
    };
    
    console.log('Creating admin user...');
    
    const { data: newAdmin, error: createError } = await supabase
      .from('users')
      .insert(adminUser)
      .select()
      .single();
    
    if (createError) {
      console.error('❌ Error creating admin user:', createError.message);
      process.exit(1);
    }
    
    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@deoraplaza.com');
    console.log('👤 Username: admin');
    console.log('🔑 Password: Admin@123!');
    console.log('🎯 Role: super_admin');
    console.log('🏢 Business Unit: all');
    console.log('⚠️ Please change the password after first login!');
    
    // Create some sample data
    console.log('\n📊 Creating sample menu categories...');
    
    const sampleCategories = [
      { name: 'Beverages', business_unit: 'cafe', display_order: 1 },
      { name: 'Snacks', business_unit: 'cafe', display_order: 2 },
      { name: 'Main Course', business_unit: 'cafe', display_order: 3 },
      { name: 'Cocktails', business_unit: 'bar', display_order: 1 },
      { name: 'Beer', business_unit: 'bar', display_order: 2 },
      { name: 'Wine', business_unit: 'bar', display_order: 3 },
      { name: 'Room Service', business_unit: 'hotel', display_order: 1 },
      { name: 'Breakfast', business_unit: 'hotel', display_order: 2 },
      { name: 'Event Catering', business_unit: 'garden', display_order: 1 }
    ];
    
    const { error: categoriesError } = await supabase
      .from('categories')
      .insert(sampleCategories);
    
    if (categoriesError) {
      console.warn('⚠️ Could not create sample categories:', categoriesError.message);
    } else {
      console.log('✅ Sample categories created');
    }
    
    // Create sample tables
    console.log('🪑 Creating sample tables...');
    
    const sampleTables = [
      { table_number: 'T1', business_unit: 'cafe', capacity: 4 },
      { table_number: 'T2', business_unit: 'cafe', capacity: 2 },
      { table_number: 'T3', business_unit: 'cafe', capacity: 6 },
      { table_number: 'B1', business_unit: 'bar', capacity: 4 },
      { table_number: 'B2', business_unit: 'bar', capacity: 2 },
      { table_number: 'G1', business_unit: 'garden', capacity: 8 },
      { table_number: 'G2', business_unit: 'garden', capacity: 10 }
    ];
    
    const { error: tablesError } = await supabase
      .from('tables')
      .insert(sampleTables);
    
    if (tablesError) {
      console.warn('⚠️ Could not create sample tables:', tablesError.message);
    } else {
      console.log('✅ Sample tables created');
    }
    
    // Create sample rooms
    console.log('🏨 Creating sample rooms...');
    
    const sampleRooms = [
      { number: '101', type: 'Standard', capacity: 2, price_per_night: 2500.00 },
      { number: '102', type: 'Standard', capacity: 2, price_per_night: 2500.00 },
      { number: '201', type: 'Deluxe', capacity: 3, price_per_night: 3500.00 },
      { number: '202', type: 'Deluxe', capacity: 3, price_per_night: 3500.00 },
      { number: '301', type: 'Suite', capacity: 4, price_per_night: 5000.00 }
    ];
    
    const { error: roomsError } = await supabase
      .from('rooms')
      .insert(sampleRooms);
    
    if (roomsError) {
      console.warn('⚠️ Could not create sample rooms:', roomsError.message);
    } else {
      console.log('✅ Sample rooms created');
    }
    
    console.log('\n🎉 Setup completed successfully!');
    console.log('🌐 You can now start the server and login with the admin credentials');
    
  } catch (error) {
    console.error('💥 Unexpected error:', error);
    process.exit(1);
  }
}

// Run the script
createRealSupabaseAdmin()
  .then(() => {
    console.log('\n✨ Ready to use DEORA Plaza with real Supabase database!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Setup failed:', error);
    process.exit(1);
  });