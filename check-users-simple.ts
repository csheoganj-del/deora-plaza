#!/usr/bin/env tsx

/**
 * Simple check for users in database
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

async function checkUsers() {
  console.log('🔍 Checking users in database...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !supabaseServiceKey) {
    console.error('❌ Missing Supabase credentials');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  
  try {
    // First, let's just get all columns to see what exists
    console.log('📋 Fetching users with basic columns...');
    
    const { data: users, error } = await supabase
      .from('users')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('❌ Error:', error.message);
      return;
    }
    
    if (!users || users.length === 0) {
      console.log('📭 No users found in database');
      return;
    }
    
    console.log(`✅ Found ${users.length} user(s):`);
    console.log('\n📊 Available columns:', Object.keys(users[0]));
    
    users.forEach((user, index) => {
      console.log(`\n${index + 1}. User Data:`);
      console.log(JSON.stringify(user, null, 2));
    });
    
  } catch (error) {
    console.error('💥 Error:', error);
  }
}

checkUsers();