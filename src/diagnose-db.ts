import { createClient } from '@supabase/supabase-client';
import fs from 'fs';
import path from 'path';

async function diagnose() {
    console.log('🚀 Starting direct database diagnosis...');

    // Load .env.local manually
    const envPath = path.resolve(process.cwd(), '.env.local');
    if (!fs.existsSync(envPath)) {
        console.error('.env.local not found');
        return;
    }

    const envContent = fs.readFileSync(envPath, 'utf8');
    const env: Record<string, string> = {};
    envContent.split('\n').forEach(line => {
        const [key, ...val] = line.split('=');
        if (key && val) env[key.trim()] = val.join('=').trim().replace(/^"(.*)"$/, '$1');
    });

    const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL || env.SUPABASE_URL;
    const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing keys in .env.local');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const date = '2025-12-30';
    const start = '2025-12-30T00:00:00.000Z'; // Adjust for your likely UTC window if needed
    const end = '2025-12-30T23:59:59.999Z';

    console.log(`Checking bills for ${date} (approx UTC range: ${start} to ${end})`);

    try {
        const { data: bills, error } = await supabase
            .from('bills')
            .select('id, businessUnit, grandTotal, paymentStatus, createdAt')
            .gte('createdAt', start)
            .lte('createdAt', end);

        if (error) throw error;

        console.log(`\nFound ${bills?.length || 0} bills in this range.`);

        const units = bills?.reduce((acc: any, b) => {
            const u = b.businessUnit || 'NULL';
            acc[u] = (acc[u] || 0) + 1;
            return acc;
        }, {});

        console.log('\n--- Count by Business Unit ---');
        console.table(units);

        const status = bills?.reduce((acc: any, b) => {
            const s = b.paymentStatus || 'NULL';
            acc[s] = (acc[s] || 0) + 1;
            return acc;
        }, {});

        console.log('\n--- Count by Payment Status ---');
        console.table(status);

        if (bills && bills.length > 0) {
            console.log('\n--- Sample Records ---');
            console.table(bills.slice(0, 5));
        }

        // Specifically check for "cafe" in different cases
        const cafeCount = bills?.filter(b => b.businessUnit?.toLowerCase() === 'cafe').length;
        console.log(`\nBills that match "cafe" (case-insensitive): ${cafeCount}`);

    } catch (err) {
        console.error('Query failed:', err);
    }
}

diagnose();
