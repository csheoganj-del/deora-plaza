// Quick environment variables test (ESM-compatible)
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

// Load both .env.local (preferred) and .env
dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

console.log('🚀 Quick Environment Test');
console.log('========================\n');

// Test Supabase vars
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseService = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('✅ Environment Variables Status:');
console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseAnon ? 'SET' : 'MISSING');
console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseService ? 'SET' : 'MISSING');

if (supabaseUrl && supabaseAnon && supabaseService) {
  console.log('\n🎉 All Supabase environment variables are present!');

  // Quick Supabase connection test
  try {
    const supabase = createClient(supabaseUrl, supabaseAnon);
    console.log('✅ Supabase client created successfully');
    console.log('📍 URL:', supabaseUrl);
    console.log('🔑 Anon Key starts with:', supabaseAnon.substring(0, 12));

    // Make a simple query to verify the key works
    const { error: authError } = await supabase.auth.getUser();
    if (authError && authError.message !== 'Invalid authentication credentials') {
      console.log('❌ Auth subsystem error:', authError.message);
    } else {
      console.log('✅ Supabase auth reachable with anon key');
    }
  } catch (error) {
    console.log('❌ Supabase client creation failed:', error.message);
  }
} else {
  console.log('\n❌ Missing environment variables!');
  console.log('Add to .env.local:');
  console.log('NEXT_PUBLIC_SUPABASE_URL=https://wjqsqwitgxqypzbaayos.supabase.co');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here');
  console.log('SUPABASE_SERVICE_ROLE_KEY=your_service_key_here');
}

process.exit(0);
