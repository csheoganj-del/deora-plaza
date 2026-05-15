import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

// Load environment variables from .env.local
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase configuration in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectData() {
    console.log('🔍 Starting Deep Inspection...');

    try {
        // 1. Total counts
        const { count: totalBills } = await supabase.from('bills').select('*', { count: 'exact', head: true });
        const { count: totalOrders } = await supabase.from('orders').select('*', { count: 'exact', head: true });

        console.log(`Total Bills in DB: ${totalBills}`);
        console.log(`Total Orders in DB: ${totalOrders}`);

        // 2. Get latest 500 bills to see the ones from today
        const { data: latestBills } = await supabase
            .from('bills')
            .select('id, billNumber, businessUnit, createdAt, grandTotal, items')
            .order('createdAt', { ascending: false })
            .limit(5);

        console.log('\n--- Latest 5 Bills (JSON) ---');
        console.log(JSON.stringify(latestBills, null, 2));
        console.log(`Fetched ${latestBills?.length} latest bills.`);

        // 3. Analyze timestamps of latest bills
        const timestampCount: Record<string, number> = {};
        latestBills?.forEach(b => {
            const time = b.createdAt!.slice(0, 19); // YYYY-MM-DDTHH:mm:ss
            timestampCount[time] = (timestampCount[time] || 0) + 1;
        });

        const batchTimes = Object.entries(timestampCount).filter(([_, count]) => count > 5);
        if (batchTimes.length > 0) {
            console.log('\n⚠️ Found potential BATCH creations (same second):');
            console.table(batchTimes.slice(0, 10).map(([time, count]) => ({ time, count })));
        }

        // 4. Check IDs of latest bills
        console.log('\n--- Latest 10 Bills ---');
        console.table(latestBills.slice(0, 10));

        // 5. Check if those orders exist
        const sampleOrderIds = latestBills.slice(0, 5).map(b => b.orderId).filter(Boolean);
        if (sampleOrderIds.length > 0) {
            const { data: sampleOrders } = await supabase.from('orders').select('id, businessUnit, createdAt').in('id', sampleOrderIds);
            console.log('\n--- Sample Parent Orders for latest bills ---');
            console.table(sampleOrders);
        }

        // 6. Check for 'bar' or 'hotel' units in all time
        const { data: unitSummary } = await supabase.from('bills').select('businessUnit');
        const unitStats = (unitSummary || []).reduce((acc: any, b) => {
            acc[b.businessUnit || 'NULL'] = (acc[b.businessUnit || 'NULL'] || 0) + 1;
            return acc;
        }, {});
        console.log('\n--- Lifetime Bills by Business Unit ---');
        console.table(unitStats);

    } catch (err) {
        console.error('❌ Error during inspection:', err);
    }
}

inspectData();
