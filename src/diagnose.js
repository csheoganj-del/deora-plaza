const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

async function run() {
    const envPath = path.resolve(process.cwd(), '.env.local');
    const envContent = fs.readFileSync(envPath, 'utf8');
    const env = {};
    envContent.split('\n').forEach(line => {
        const [key, ...val] = line.split('=');
        if (key && val) env[key.trim()] = val.join('=').trim().replace(/^"(.*)"$/, '$1');
    });

    const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

    console.log('Querying Database...');

    const results = {
        meta: {
            date: '2025-12-30',
            timestamp: new Date().toISOString()
        }
    };

    try {
        // 1. Total Paid Bills today
        const { data: billsToday } = await supabase
            .from('bills')
            .select('businessUnit, grandTotal, paymentStatus, createdAt')
            .gte('createdAt', '2025-12-30T00:00:00.000Z')
            .lte('createdAt', '2025-12-30T23:59:59.999Z')
            .eq('paymentStatus', 'paid');

        results.dayBreakdown = (billsToday || []).reduce((acc, b) => {
            const u = b.businessUnit || 'MISSING';
            if (!acc[u]) acc[u] = { count: 0, revenue: 0 };
            acc[u].count++;
            acc[u].revenue += (b.grandTotal || 0);
            return acc;
        }, {});

        results.totalBillsToday = billsToday?.length || 0;

        // 2. All bills check (to see if 328 is total)
        const { count: totalEver } = await supabase.from('bills').select('*', { count: 'exact', head: true });
        results.totalBillsEver = totalEver;

        // 3. Check for specific unit match
        const { count: cafeMatch } = await supabase.from('bills').select('*', { count: 'exact', head: true }).eq('businessUnit', 'cafe');
        results.cafeMatchCount = cafeMatch;

        // 4. Case sensitivity test
        const { count: cafeCapsMatch } = await supabase.from('bills').select('*', { count: 'exact', head: true }).eq('businessUnit', 'Cafe');
        results.cafeCapsMatchCount = cafeCapsMatch;

        fs.writeFileSync('diag_result.json', JSON.stringify(results, null, 2));
        console.log('Results written to diag_result.json');

    } catch (err) {
        fs.writeFileSync('diag_error.txt', err.stack || String(err));
    }
}

run();
