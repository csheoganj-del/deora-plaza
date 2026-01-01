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

async function findHiddenDates() {
    const { data: bills } = await supabase
        .from('bills')
        .select('id, items, billNumber');

    let foundCount = 0;
    bills?.forEach(b => {
        let items = [];
        try {
            items = typeof b.items === 'string' ? JSON.parse(b.items) : b.items;
        } catch (e) { }

        items.forEach((item: any) => {
            const keys = Object.keys(item);
            const dateKeys = keys.filter(k => k.toLowerCase().includes('date') || k.toLowerCase().includes('time'));
            if (dateKeys.length > 0) {
                console.log(`Bill ${b.billNumber} has item with date keys:`, item);
                foundCount++;
            }
            // Check if ID is a plausible timestamp
            if (typeof item.id === 'string' && item.id.length > 10) {
                const ts = parseInt(item.id);
                if (!isNaN(ts) && ts > 1600000000000 && ts < 1800000000000) {
                    // It's a timestamp
                    // console.log(`Bill ${b.billNumber} has timestamp ID: ${new Date(ts).toISOString()}`);
                }
            }
        });
    });

    console.log(`Searched ${bills?.length} bills. Found ${foundCount} items with potential date keys.`);
}
findHiddenDates();
