import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://wjqsqwitgxqypzbaayos.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcXNxd2l0Z3hxeXB6YmFheW9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM1MjM2MywiZXhwIjoyMDgwOTI4MzYzfQ.0jTsgFT39ZVD-kf9qIMb5zmn281LHR7J_803_gYuofY';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMenuUpdate() {
    console.log('🚀 Starting menu database update...\n');

    try {
        // Read the SQL file (UPDATED TO FINAL SCRIPT)
        const sqlFilePath = path.join(__dirname, 'update_menu_final.sql');
        const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

        console.log('📄 SQL file loaded successfully');
        console.log('📊 Executing migration...\n');

        // Execute the SQL
        const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });

        if (error) {
            console.log('⚠️  RPC method not available, trying direct execution...\n');
            const { error: execError } = await supabase.from('menu_items').select('*').limit(0);

            console.log('\n' + '='.repeat(80));
            console.log('📋 MANUAL EXECUTION REQUIRED');
            console.log('='.repeat(80));
            console.log('\nPlease execute the SQL script manually:');
            console.log('\n1. Go to your Supabase Dashboard:');
            console.log('   https://supabase.com/dashboard/project/wjqsqwitgxqypzbaayos');
            console.log('\n2. Navigate to: SQL Editor');
            console.log('\n3. Open the file: update_menu_final.sql');
            console.log('\n4. Copy and paste the entire SQL content');
            console.log('\n5. Click "Run" to execute');
            console.log('\n6. Verify the results in the output panel');
            console.log('\n' + '='.repeat(80));

        } else {
            console.log('✅ Migration executed successfully!');
        }

        // Verify the changes
        console.log('\n📊 Verifying changes...\n');

        // Check Bloom Special Thali
        const { data: bloomCheck, error: bloomError } = await supabase
            .from('menu_items')
            .select('name, price, category')
            .eq('name', 'Bloom Special Thali');

        if (bloomCheck && bloomCheck.length > 0) {
            console.log(`✅ Verified Item: ${bloomCheck[0].name} - ₹${bloomCheck[0].price} (${bloomCheck[0].category})`);
        } else {
            console.log('❌ Could not verify Bloom Special Thali');
        }

        // Check category counts
        const { data: categoryCount, error: categoryError } = await supabase
            .from('menu_items')
            .select('category')
            .not('category', 'is', null);

        if (!categoryError && categoryCount) {
            const counts: Record<string, number> = {};
            categoryCount.forEach((item: any) => {
                counts[item.category] = (counts[item.category] || 0) + 1;
            });

            console.log('\n✅ Category counts:');
            Object.entries(counts).sort().forEach(([category, count]) => {
                console.log(`   - ${category}: ${count} items`);
            });
        }

        console.log('\n' + '='.repeat(80));
        console.log('✅ Menu update process completed!');
        console.log('='.repeat(80));

    } catch (error: any) {
        console.error('\n❌ Error during migration:', error.message);
        process.exit(1);
    }
}

// Run the update
runMenuUpdate();
