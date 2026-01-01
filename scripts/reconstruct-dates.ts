import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = dotenv.parse(fs.readFileSync(envPath));
    for (const k in envConfig) {
        process.env[k] = envConfig[k];
    }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl!, supabaseKey!);

async function extractTimestamps() {
    const { data: bills } = await supabase
        .from('bills')
        .select('id, items, billNumber, createdAt');

    const results: any[] = [];
    bills?.forEach(b => {
        let items = [];
        try {
            items = typeof b.items === 'string' ? JSON.parse(b.items) : b.items;
        } catch (e) { }

        let minTs = Infinity;
        let maxTs = -Infinity;

        items.forEach((item: any) => {
            if (typeof item.id === 'string' && item.id.length > 10) {
                const ts = parseInt(item.id);
                if (!isNaN(ts) && ts > 1600000000000 && ts < 1850000000000) {
                    if (ts < minTs) minTs = ts;
                    if (ts > maxTs) maxTs = ts;
                }
            }
        });

        if (minTs !== Infinity) {
            results.push({
                billNumber: b.billNumber,
                minDate: new Date(minTs).toISOString(),
                maxDate: new Date(maxTs).toISOString(),
                currentCreatedAt: b.createdAt
            });
        }
    });

    // Group by day to see distribution
    const dayGroups: Record<string, number> = {};
    results.forEach(r => {
        const day = r.minDate.split('T')[0];
        dayGroups[day] = (dayGroups[day] || 0) + 1;
    });

    console.log('--- Reconstructed Bill Dates (Summary) ---');
    console.table(dayGroups);

    if (results.length > 0) {
        console.log('\nSample reconstructed dates:');
        console.table(results.slice(0, 10));
    }
}
extractTimestamps();
