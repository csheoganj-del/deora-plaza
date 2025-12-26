#!/usr/bin/env tsx

/**
 * DEORA Plaza - Complete System Setup Script
 * 
 * This script sets up the entire DEORA Plaza system with:
 * - Database schema and tables
 * - Security configurations
 * - Default data and settings
 * - Admin user creation
 * - System validation
 */

import { supabaseServer } from './src/lib/supabase/server';
import { validateSecurityEnvironment } from './src/lib/security-config';
import bcrypt from 'bcryptjs';

interface SetupResult {
  success: boolean;
  message: string;
  details?: any;
}

async function validateEnvironment(): Promise<SetupResult> {
  console.log('🔍 Validating environment configuration...');
  
  const validation = validateSecurityEnvironment();
  
  if (!validation.isValid) {
    return {
      success: false,
      message: 'Environment validation failed',
      details: validation.errors
    };
  }
  
  // Test Supabase connection
  try {
    const { data, error } = await supabaseServer.from('users').select('count').limit(1);
    if (error) {
      throw error;
    }
    console.log('✅ Supabase connection successful');
  } catch (error) {
    return {
      success: false,
      message: 'Supabase connection failed',
      details: error
    };
  }
  
  return {
    success: true,
    message: 'Environment validation passed'
  };
}

async function setupDatabase(): Promise<SetupResult> {
  console.log('🗄️ Setting up database schema...');
  
  try {
    // The schema is handled by Supabase migrations
    // Here we just verify the tables exist
    
    const requiredTables = [
      'users', 'bills', 'orders', 'customers', 'menu_items', 'tables',
      'audit_logs', 'gst_config', 'settlements', 'inventory', 
      'stock_movements', 'low_stock_alerts', 'notifications', 'system_settings'
    ];
    
    for (const table of requiredTables) {
      const { error } = await supabaseServer.from(table).select('count').limit(1);
      if (error) {
        console.warn(`⚠️ Table ${table} may not exist or is not accessible`);
      } else {
        console.log(`✅ Table ${table} verified`);
      }
    }
    
    return {
      success: true,
      message: 'Database schema setup completed'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Database setup failed',
      details: error
    };
  }
}

async function createAdminUser(): Promise<SetupResult> {
  console.log('👤 Creating admin user...');
  
  try {
    // Check if admin user already exists
    const { data: existingAdmin } = await supabaseServer
      .from('users')
      .select('id')
      .eq('role', 'super_admin')
      .limit(1);
    
    if (existingAdmin && existingAdmin.length > 0) {
      console.log('ℹ️ Admin user already exists');
      return {
        success: true,
        message: 'Admin user already exists'
      };
    }
    
    // Create admin user
    const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@123!';
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    
    const adminUser = {
      username: 'admin',
      email: 'admin@deoraplaza.com',
      phoneNumber: '+91-9999999999',
      password: hashedPassword,
      role: 'super_admin',
      businessUnit: 'all',
      permissions: [
        'view_dashboard', 'view_analytics', 'export_reports',
        'manage_business_units', 'manage_orders', 'manage_inventory',
        'manage_customers', 'manage_staff', 'view_kds', 'manage_kds',
        'create_bookings', 'manage_rooms', 'manage_events',
        'view_feedback', 'manage_feedback'
      ],
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    const { data, error } = await supabaseServer
      .from('users')
      .insert(adminUser)
      .select()
      .single();
    
    if (error) {
      throw error;
    }
    
    console.log('✅ Admin user created successfully');
    console.log(`📧 Email: ${adminUser.email}`);
    console.log(`🔑 Password: ${adminPassword}`);
    console.log('⚠️ Please change the password after first login!');
    
    return {
      success: true,
      message: 'Admin user created successfully',
      details: {
        email: adminUser.email,
        password: adminPassword
      }
    };
  } catch (error) {
    return {
      success: false,
      message: 'Admin user creation failed',
      details: error
    };
  }
}

async function setupDefaultData(): Promise<SetupResult> {
  console.log('📊 Setting up default data...');
  
  try {
    // Create default business settings for each unit
    const businessUnits = ['cafe', 'bar', 'hotel', 'garden'];
    
    for (const unit of businessUnits) {
      const { data: existingSettings } = await supabaseServer
        .from('businessSettings')
        .select('id')
        .eq('businessUnit', unit)
        .limit(1);
      
      if (!existingSettings || existingSettings.length === 0) {
        const defaultSettings = {
          businessUnit: unit,
          name: `DEORA Plaza ${unit.charAt(0).toUpperCase() + unit.slice(1)}`,
          address: 'DEORA Plaza, Main Street, City',
          phone: '+91-9999999999',
          email: `${unit}@deoraplaza.com`,
          gstNumber: `22AAAAA0000A1Z${unit.charAt(0).toUpperCase()}`,
          enablePasswordProtection: true,
          defaultGstRate: 18,
          enableWaiterlessMode: unit === 'cafe',
          enableTableBooking: unit !== 'hotel',
          enableRoomService: unit === 'hotel',
          operatingHours: {
            monday: { open: '09:00', close: '22:00', closed: false },
            tuesday: { open: '09:00', close: '22:00', closed: false },
            wednesday: { open: '09:00', close: '22:00', closed: false },
            thursday: { open: '09:00', close: '22:00', closed: false },
            friday: { open: '09:00', close: '23:00', closed: false },
            saturday: { open: '09:00', close: '23:00', closed: false },
            sunday: { open: '10:00', close: '22:00', closed: false }
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        
        await supabaseServer.from('businessSettings').insert(defaultSettings);
        console.log(`✅ Default settings created for ${unit}`);
      }
    }
    
    // Create sample menu categories
    const categories = [
      { name: 'Beverages', businessUnit: 'cafe', displayOrder: 1 },
      { name: 'Snacks', businessUnit: 'cafe', displayOrder: 2 },
      { name: 'Main Course', businessUnit: 'cafe', displayOrder: 3 },
      { name: 'Cocktails', businessUnit: 'bar', displayOrder: 1 },
      { name: 'Beer', businessUnit: 'bar', displayOrder: 2 },
      { name: 'Wine', businessUnit: 'bar', displayOrder: 3 },
      { name: 'Room Service', businessUnit: 'hotel', displayOrder: 1 },
      { name: 'Breakfast', businessUnit: 'hotel', displayOrder: 2 },
      { name: 'Event Catering', businessUnit: 'garden', displayOrder: 1 }
    ];
    
    for (const category of categories) {
      const { data: existingCategory } = await supabaseServer
        .from('categories')
        .select('id')
        .eq('name', category.name)
        .eq('businessUnit', category.businessUnit)
        .limit(1);
      
      if (!existingCategory || existingCategory.length === 0) {
        await supabaseServer.from('categories').insert({
          ...category,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
        console.log(`✅ Category '${category.name}' created for ${category.businessUnit}`);
      }
    }
    
    return {
      success: true,
      message: 'Default data setup completed'
    };
  } catch (error) {
    return {
      success: false,
      message: 'Default data setup failed',
      details: error
    };
  }
}

async function validateSystem(): Promise<SetupResult> {
  console.log('🔍 Validating system setup...');
  
  try {
    const validations = [];
    
    // Check admin user exists
    const { data: adminUser } = await supabaseServer
      .from('users')
      .select('id, role')
      .eq('role', 'super_admin')
      .limit(1);
    
    validations.push({
      check: 'Admin user exists',
      passed: adminUser && adminUser.length > 0
    });
    
    // Check business settings exist
    const { data: businessSettings } = await supabaseServer
      .from('businessSettings')
      .select('businessUnit');
    
    const expectedUnits = ['cafe', 'bar', 'hotel', 'garden'];
    const existingUnits = businessSettings?.map(s => s.businessUnit) || [];
    const allUnitsExist = expectedUnits.every(unit => existingUnits.includes(unit));
    
    validations.push({
      check: 'Business settings for all units',
      passed: allUnitsExist
    });
    
    // Check GST configuration
    const { data: gstConfig } = await supabaseServer
      .from('gst_config')
      .select('business_unit')
      .eq('is_active', true);
    
    const gstUnits = gstConfig?.map(g => g.business_unit) || [];
    const allGstConfigExists = expectedUnits.every(unit => gstUnits.includes(unit));
    
    validations.push({
      check: 'GST configuration for all units',
      passed: allGstConfigExists
    });
    
    // Check system settings
    const { data: systemSettings } = await supabaseServer
      .from('system_settings')
      .select('key');
    
    const requiredSettings = ['app_name', 'default_currency', 'default_gst_rate'];
    const existingSettings = systemSettings?.map(s => s.key) || [];
    const allSettingsExist = requiredSettings.every(setting => existingSettings.includes(setting));
    
    validations.push({
      check: 'Required system settings',
      passed: allSettingsExist
    });
    
    const allPassed = validations.every(v => v.passed);
    
    console.log('\n📋 Validation Results:');
    validations.forEach(v => {
      console.log(`${v.passed ? '✅' : '❌'} ${v.check}`);
    });
    
    return {
      success: allPassed,
      message: allPassed ? 'System validation passed' : 'System validation failed',
      details: validations
    };
  } catch (error) {
    return {
      success: false,
      message: 'System validation failed',
      details: error
    };
  }
}

async function main() {
  console.log('🚀 DEORA Plaza - Complete System Setup');
  console.log('=====================================\n');
  
  const steps = [
    { name: 'Environment Validation', fn: validateEnvironment },
    { name: 'Database Setup', fn: setupDatabase },
    { name: 'Admin User Creation', fn: createAdminUser },
    { name: 'Default Data Setup', fn: setupDefaultData },
    { name: 'System Validation', fn: validateSystem }
  ];
  
  let allSuccessful = true;
  const results = [];
  
  for (const step of steps) {
    console.log(`\n🔄 ${step.name}...`);
    const result = await step.fn();
    results.push({ step: step.name, ...result });
    
    if (result.success) {
      console.log(`✅ ${result.message}`);
    } else {
      console.error(`❌ ${result.message}`);
      if (result.details) {
        console.error('Details:', result.details);
      }
      allSuccessful = false;
    }
  }
  
  console.log('\n=====================================');
  console.log('🏁 Setup Complete!');
  console.log('=====================================\n');
  
  if (allSuccessful) {
    console.log('🎉 DEORA Plaza system setup completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Start the backend system: npm run backend:start');
    console.log('3. Access the admin dashboard at: http://localhost:3000/dashboard');
    console.log('4. Login with the admin credentials shown above');
    console.log('5. Change the default admin password');
    console.log('6. Configure your business settings');
    console.log('\n🔒 Security Reminders:');
    console.log('- Change all default passwords');
    console.log('- Review and update environment variables');
    console.log('- Enable proper SSL certificates in production');
    console.log('- Set up regular database backups');
  } else {
    console.log('⚠️ Setup completed with errors. Please review the issues above.');
    console.log('\n📋 Failed Steps:');
    results
      .filter(r => !r.success)
      .forEach(r => console.log(`- ${r.step}: ${r.message}`));
  }
  
  console.log('\n📚 Documentation:');
  console.log('- Backend README: ./BACKEND_README.md');
  console.log('- Security Guide: ./SECURITY_CONFIG.md');
  console.log('- Database Setup: ./DATABASE_SETUP_GUIDE.md');
  
  process.exit(allSuccessful ? 0 : 1);
}

// Run the setup
main().catch(error => {
  console.error('💥 Setup failed with error:', error);
  process.exit(1);
});