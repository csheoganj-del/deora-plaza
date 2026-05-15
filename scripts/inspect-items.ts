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

async function inspectItems() {
    const { data: sampleBills } = await supabase
        .from('bills')
        .select('id, billNumber, businessUnit, items, grandTotal')
        .limit(10);

    console.log('--- Sample Bills Items ---');
    sampleBills?.forEach(b => {
        console.log(`\nBill: ${b.billNumber} (${b.businessUnit})`);
        let items = b.items;
        if (typeof items === 'string') {
            try { items = JSON.parse(items); } catch (e) { }
        }
        console.log('Items type:', Array.isArray(items) ? 'Array' : typeof items);
        console.log('Sample Item Units:', Array.isArray(items) ? [...new Set(items.map((i: any) => i.businessUnit))] : 'N/A');
        console.log('JSON Length:', JSON.stringify(items).length);
    });
}
inspectItems();
