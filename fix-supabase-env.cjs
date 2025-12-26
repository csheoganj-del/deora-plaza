// Fix Supabase Environment Variables
// This script fixes the missing SUPABASE_URL environment variable

const fs = require('fs');
const path = require('path');

console.log('🔧 Fixing Supabase Environment Variables...');
console.log('============================================\n');

async function fixSupabaseEnv() {
  try {
    // Load current .env file
    const envPath = path.join(__dirname, '.env');

    if (!fs.existsSync(envPath)) {
      console.error('❌ .env file not found!');
      process.exit(1);
    }

    console.log('📄 Reading current .env file...');
    let envContent = fs.readFileSync(envPath, 'utf8');
    console.log('✅ .env file loaded');

    // Check if SUPABASE_URL already exists
    if (envContent.includes('SUPABASE_URL=') && !envContent.includes('SUPABASE_URL=""') && !envContent.includes('SUPABASE_URL=\n')) {
      console.log('✅ SUPABASE_URL already exists in .env file');
      return;
    }

    // Extract NEXT_PUBLIC_SUPABASE_URL value
    const urlMatch = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);

    if (!urlMatch || !urlMatch[1]) {
      console.error('❌ NEXT_PUBLIC_SUPABASE_URL not found in .env file');
      console.log('Please make sure your .env file contains:');
      console.log('NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co');
      process.exit(1);
    }

    const supabaseUrl = urlMatch[1].trim();
    console.log(`📋 Found NEXT_PUBLIC_SUPABASE_URL: ${supabaseUrl}`);

    // Add or update SUPABASE_URL
    let newContent;
    if (envContent.includes('SUPABASE_URL=')) {
      // Replace existing empty SUPABASE_URL
      console.log('🔄 Updating existing SUPABASE_URL...');
      newContent = envContent.replace(/SUPABASE_URL=.*/g, `SUPABASE_URL=${supabaseUrl}`);
    } else {
      // Add new SUPABASE_URL after NEXT_PUBLIC_SUPABASE_URL
      console.log('➕ Adding SUPABASE_URL...');
      newContent = envContent.replace(
        /NEXT_PUBLIC_SUPABASE_URL=.+/,
        `$&\nSUPABASE_URL=${supabaseUrl}`
      );
    }

    // Write back to .env file
    console.log('💾 Writing updated .env file...');
    fs.writeFileSync(envPath, newContent);
    console.log('✅ .env file updated successfully!');

    // Also update .env.local if it exists
    const envLocalPath = path.join(__dirname, '.env.local');
    if (fs.existsSync(envLocalPath)) {
      console.log('\n📄 Updating .env.local file...');
      let envLocalContent = fs.readFileSync(envLocalPath, 'utf8');

      if (!envLocalContent.includes('SUPABASE_URL=') || envLocalContent.includes('SUPABASE_URL=""')) {
        const localUrlMatch = envLocalContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
        const localUrl = localUrlMatch ? localUrlMatch[1].trim() : supabaseUrl;

        if (envLocalContent.includes('SUPABASE_URL=')) {
          envLocalContent = envLocalContent.replace(/SUPABASE_URL=.*/g, `SUPABASE_URL=${localUrl}`);
        } else {
          envLocalContent = envLocalContent.replace(
            /NEXT_PUBLIC_SUPABASE_URL=.+/,
            `$&\nSUPABASE_URL=${localUrl}`
          );
        }

        fs.writeFileSync(envLocalPath, envLocalContent);
        console.log('✅ .env.local file updated successfully!');
      } else {
        console.log('✅ SUPABASE_URL already exists in .env.local');
      }
    }

    console.log('\n🎉 Environment Fix Complete!');
    console.log('===============================');
    console.log('✅ SUPABASE_URL has been set to match NEXT_PUBLIC_SUPABASE_URL');
    console.log('✅ Both client-side and server-side Supabase connections should now work');
    console.log('\nNext steps:');
    console.log('1. Restart your development server');
    console.log('2. Test customer creation in order flow');
    console.log('3. Check that customers appear in the customers section');

  } catch (error) {
    console.error('❌ Error fixing environment variables:', error);
    process.exit(1);
  }
}

// Verification function
async function verifyFix() {
  console.log('\n🔍 Verifying Fix...');
  console.log('===================');

  // Load environment variables
  require('dotenv').config();

  const checks = [
    {
      name: 'NEXT_PUBLIC_SUPABASE_URL',
      value: process.env.NEXT_PUBLIC_SUPABASE_URL,
      required: true
    },
    {
      name: 'SUPABASE_URL',
      value: process.env.SUPABASE_URL,
      required: true
    },
    {
      name: 'NEXT_PUBLIC_SUPABASE_ANON_KEY',
      value: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      required: true
    },
    {
      name: 'SUPABASE_SERVICE_ROLE_KEY',
      value: process.env.SUPABASE_SERVICE_ROLE_KEY,
      required: true
    }
  ];

  let allValid = true;

  checks.forEach(check => {
    const status = check.value ? '✅' : '❌';
    const display = check.value ? 'Set' : 'Missing';
    console.log(`${status} ${check.name}: ${display}`);

    if (check.required && !check.value) {
      allValid = false;
    }
  });

  if (allValid) {
    console.log('\n🎉 All required environment variables are set!');
    console.log('✅ Customer creation should now work properly');
  } else {
    console.log('\n❌ Some required environment variables are still missing');
    console.log('Please check your .env and .env.local files');
  }

  return allValid;
}

// Run the fix
if (require.main === module) {
  fixSupabaseEnv()
    .then(() => verifyFix())
    .then((success) => {
      if (success) {
        console.log('\n✅ Environment Fix: SUCCESS');
        process.exit(0);
      } else {
        console.log('\n❌ Environment Fix: INCOMPLETE');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('\n❌ Fix failed:', error);
      process.exit(1);
    });
}

module.exports = { fixSupabaseEnv, verifyFix };
