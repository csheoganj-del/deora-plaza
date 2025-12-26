// Simple script to set SUPABASE_URL environment variable
const fs = require('fs');
const path = require('path');

console.log('🔧 Setting SUPABASE_URL environment variable...\n');

try {
  // Read .env file
  const envPath = path.join(__dirname, '.env');
  let envContent = fs.readFileSync(envPath, 'utf8');
  console.log('✅ Read .env file');

  // Extract NEXT_PUBLIC_SUPABASE_URL
  const match = envContent.match(/NEXT_PUBLIC_SUPABASE_URL=(.+)/);
  if (!match) {
    console.error('❌ Could not find NEXT_PUBLIC_SUPABASE_URL');
    process.exit(1);
  }

  const url = match[1].trim();
  console.log(`📋 Found URL: ${url}`);

  // Add SUPABASE_URL if not exists
  if (!envContent.includes('SUPABASE_URL=')) {
    envContent += `\nSUPABASE_URL=${url}\n`;
    console.log('➕ Added SUPABASE_URL');
  } else {
    // Replace existing SUPABASE_URL
    envContent = envContent.replace(/SUPABASE_URL=.*/g, `SUPABASE_URL=${url}`);
    console.log('🔄 Updated existing SUPABASE_URL');
  }

  // Write back
  fs.writeFileSync(envPath, envContent);
  console.log('💾 Saved .env file');

  // Also update .env.local if exists
  const envLocalPath = path.join(__dirname, '.env.local');
  if (fs.existsSync(envLocalPath)) {
    let envLocalContent = fs.readFileSync(envLocalPath, 'utf8');

    if (!envLocalContent.includes('SUPABASE_URL=')) {
      envLocalContent += `\nSUPABASE_URL=${url}\n`;
    } else {
      envLocalContent = envLocalContent.replace(/SUPABASE_URL=.*/g, `SUPABASE_URL=${url}`);
    }

    fs.writeFileSync(envLocalPath, envLocalContent);
    console.log('💾 Updated .env.local file');
  }

  console.log('\n🎉 SUPABASE_URL set successfully!');
  console.log('✅ Please restart your development server');

} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
