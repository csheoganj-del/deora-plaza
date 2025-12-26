const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addBillNumberColumn() {
  console.log('🔧 ADDING BILLNUMBER COLUMN TO BILLS TABLE');
  console.log('==========================================\n');

  try {
    console.log('1. 🔗 Testing database connection...');

    // Test connection first
    const { data: testConnection, error: connectionError } = await supabase
      .from('bills')
      .select('id')
      .limit(1);

    if (connectionError) {
      console.error('❌ Database connection failed:', connectionError);
      return false;
    }

    console.log('✅ Database connection successful\n');

    console.log('2. 📊 Checking current bills table structure...');

    // Get current structure by attempting to insert a minimal record
    const { data: currentStructure, error: structureError } = await supabase
      .from('bills')
      .insert({
        businessUnit: 'test',
        subtotal: 1,
        gstPercent: 0,
        gstAmount: 0,
        grandTotal: 1
      })
      .select();

    if (structureError) {
      console.error('❌ Could not analyze current structure:', structureError);
      return false;
    }

    const currentColumns = Object.keys(currentStructure[0]);
    console.log('✅ Current columns:', currentColumns.join(', '));

    // Clean up test record
    await supabase.from('bills').delete().eq('id', currentStructure[0].id);

    // Check if billNumber already exists
    if (currentColumns.includes('billNumber')) {
      console.log('✅ billNumber column already exists!');
      console.log('🎉 No fix needed - the column is already there.\n');
      return true;
    }

    console.log('❌ billNumber column is missing\n');

    console.log('3. 🛠️  Attempting to add billNumber column...');

    // Method 1: Try using raw SQL if RPC function exists
    console.log('   Trying Method 1: Raw SQL execution...');

    const { data: sqlResult, error: sqlError } = await supabase
      .rpc('exec_sql', {
        sql: 'ALTER TABLE bills ADD COLUMN billNumber VARCHAR(50) UNIQUE;'
      });

    if (!sqlError) {
      console.log('✅ Method 1 SUCCESS: billNumber column added via SQL!');
      return await verifyColumnAdded();
    }

    console.log('   ⚠️  Method 1 failed:', sqlError.message);

    // Method 2: Try direct schema modification (usually not allowed)
    console.log('   Trying Method 2: Direct schema API...');

    try {
      const { error: schemaError } = await supabase.schema
        .alterTable('bills')
        .addColumn('billNumber', 'varchar(50)', { unique: true });

      if (!schemaError) {
        console.log('✅ Method 2 SUCCESS: billNumber column added via schema API!');
        return await verifyColumnAdded();
      }

      console.log('   ⚠️  Method 2 failed:', schemaError.message);
    } catch (schemaErr) {
      console.log('   ⚠️  Method 2 not available:', schemaErr.message);
    }

    // Method 3: Try creating a new table and copying data
    console.log('   Trying Method 3: Manual column simulation...');

    // This won't actually add the column, but we can simulate it
    console.log('   ❌ Method 3: Cannot add column programmatically');

    // If all methods fail, provide clear instructions
    console.log('\n🚨 AUTOMATIC FIX FAILED');
    console.log('========================');
    console.log('The billNumber column could not be added programmatically.');
    console.log('This is normal - most database systems require manual schema changes.\n');

    console.log('🛠️  MANUAL FIX REQUIRED:');
    console.log('1. Go to https://app.supabase.com');
    console.log('2. Select your DEORA project');
    console.log('3. Click "SQL Editor" in the sidebar');
    console.log('4. Paste this SQL:');
    console.log('   ALTER TABLE bills ADD COLUMN billNumber VARCHAR(50) UNIQUE;');
    console.log('5. Click "Run"');
    console.log('6. Run this script again to verify\n');

    return false;

  } catch (error) {
    console.error('❌ UNEXPECTED ERROR:', error.message);
    console.log('\n🔍 TROUBLESHOOTING:');
    console.log('- Check your .env file has correct Supabase credentials');
    console.log('- Verify NEXT_PUBLIC_SUPABASE_URL is correct');
    console.log('- Verify SUPABASE_SERVICE_ROLE_KEY is correct');
    console.log('- Ensure your Supabase project is active');

    return false;
  }
}

async function verifyColumnAdded() {
  console.log('\n4. ✅ Verifying billNumber column was added...');

  try {
    const testBillNumber = `TEST-${Date.now()}`;

    const { data: verifyResult, error: verifyError } = await supabase
      .from('bills')
      .insert({
        billNumber: testBillNumber,
        businessUnit: 'test',
        subtotal: 1,
        gstPercent: 0,
        gstAmount: 0,
        grandTotal: 1
      })
      .select();

    if (verifyError) {
      console.error('❌ Verification failed:', verifyError);
      return false;
    }

    console.log('✅ billNumber column is working!');
    console.log('   Test record created with billNumber:', verifyResult[0].billNumber);

    // Clean up
    await supabase.from('bills').delete().eq('id', verifyResult[0].id);
    console.log('   Test record cleaned up');

    console.log('\n🎉 SUCCESS! BILLNUMBER COLUMN ADDED AND VERIFIED!');
    console.log('================================================');
    console.log('✅ The "Failed to generate bill" error should now be fixed');
    console.log('🚀 Restart your app and try generating a bill as cafe_manager');

    return true;

  } catch (error) {
    console.error('❌ Verification error:', error);
    return false;
  }
}

// Run the fix
addBillNumberColumn().then(success => {
  if (success) {
    console.log('\n🎊 Column addition completed successfully!');
    process.exit(0);
  } else {
    console.log('\n💥 Column addition failed - manual fix required');
    process.exit(1);
  }
});
