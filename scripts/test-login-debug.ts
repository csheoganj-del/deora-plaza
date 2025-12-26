#!/usr/bin/env tsx

/**
 * 🔍 Login Debug Test
 * 
 * Tests the login system to identify why it's getting stuck
 */

import { queryDocuments } from "../src/lib/supabase/database";

async function testLoginDebug() {
  console.log('🔍 LOGIN DEBUG TEST');
  console.log('==================');

  try {
    // Test database connection
    console.log('📡 Testing database connection...');
    const users = await queryDocuments("users", []);
    console.log(`✅ Database connected. Found ${users.length} users.`);
    
    if (users.length === 0) {
      console.log('❌ NO USERS FOUND! This is why login is failing.');
      console.log('💡 You need to create users first.');
      return;
    }

    // Show available users
    console.log('\n👥 Available users:');
    users.forEach((user: any, index: number) => {
      console.log(`${index + 1}. Username: ${user.username || 'N/A'}`);
      console.log(`   Phone: ${user.phoneNumber || 'N/A'}`);
      console.log(`   Name: ${user.name || 'N/A'}`);
      console.log(`   Role: ${user.role || 'N/A'}`);
      console.log(`   Active: ${user.isActive ? 'Yes' : 'No'}`);
      console.log(`   Auth Method: ${user.authMethod || 'N/A'}`);
      console.log(`   Has Password: ${user.password ? 'Yes' : 'No'}`);
      console.log('   ---');
    });

    // Test login with first user if available
    if (users.length > 0) {
      const testUser = users[0];
      console.log(`\n🧪 Testing login with user: ${testUser.username || testUser.phoneNumber}`);
      
      if (!testUser.password) {
        console.log('❌ User has no password set!');
      } else {
        console.log('✅ User has password set');
      }
      
      if (!testUser.isActive) {
        console.log('❌ User is not active!');
      } else {
        console.log('✅ User is active');
      }
    }

  } catch (error) {
    console.error('❌ Database connection failed:', error);
    console.log('\n💡 Possible issues:');
    console.log('1. Supabase credentials not set correctly');
    console.log('2. Database not accessible');
    console.log('3. Users table does not exist');
  }
}

testLoginDebug().catch(console.error);