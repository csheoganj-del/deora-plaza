import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Manual env loader
function getEnv() {
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) return {};
    return fs.readFileSync(envPath, 'utf8').split('\n').reduce((acc, line) => {
        const [key, ...val] = line.split('=');
        if (key) acc[key.trim()] = val.join('=').trim().replace(/^"(.*)"$/, '$1');
        return acc;
    }, {} as Record<string, string>);
}

async function run() {
    const env = getEnv();
    const url = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
    const key = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !key) {
        console.error('Missing Supabase keys in .env.local');
        return;
    }

    const supabase = createClient(url, key);
    const targetDate = '2025-12-30';

    console.log(`--- Diagnosing Bills for ${targetDate} ---`);

    // 1. Total count
    const { count: totalDayCount } = await supabase
        .from('bills')
        .select('*', { count: 'exact', head: true })
        .gte('createdAt', `${targetDate}T00:00:00.000Z`)
        .lte('createdAt', `${targetDate}T23:59:59.999Z`);

    console.log(`Total bills for the day (UTC): ${totalDayCount}`);

    // 2. Unit breakdown
    const { data: bills } = await supabase
        .from('bills')
        .select('businessUnit, grandTotal, paymentStatus')
        .gte('createdAt', `${targetDate}T00:00:00.000Z`)
        .lte('createdAt', `${targetDate}T23:59:59.999Z`);

    const stats = bills?.reduce((acc: any, b) => {
        const u = b.businessUnit || 'MISSING';
        if (!acc[u]) acc[u] = { count: 0, revenue: 0 };
        acc[u].count++;
        if (b.paymentStatus === 'paid') acc[u].revenue += (b.grandTotal || 0);
        return acc;
    }, {});

    console.log('\n--- breakdown by businessUnit ---');
    console.table(stats);

    // 3. check all time to see if 328 is the life-time count
    const { count: lifetimeCount } = await supabase
        .from('bills')
        .select('*', { count: 'exact', head: true });

    console.log(`\nLife-time total bills in database: ${lifetimeCount}`);

    const { count: lifetimeCafeCount } = await supabase
        .from('bills')
        .select('*', { count: 'exact', head: true })
        .eq('businessUnit', 'cafe');

    console.log(`Life-time 'cafe' bills: ${lifetimeCafeCount}`);

}

run().catch(console.error);
