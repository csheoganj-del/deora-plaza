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

async function analyzeBillNumbers() {
    const { data: bills } = await supabase
        .from('bills')
        .select('billNumber, createdAt');

    const dateGroups: Record<string, number> = {};
    const createdGroups: Record<string, number> = {};

    bills?.forEach(b => {
        const match = b.billNumber.match(/BILL-(\d{8})-/);
        if (match) {
            const date = match[1];
            dateGroups[date] = (dateGroups[date] || 0) + 1;
        } else {
            dateGroups['OTHER'] = (dateGroups['OTHER'] || 0) + 1;
        }

        const cDate = b.createdAt.split('T')[0];
        createdGroups[cDate] = (createdGroups[cDate] || 0) + 1;
    });

    console.log('--- Bill Numbers by Date Prefix ---');
    console.table(dateGroups);

    console.log('\n--- Bills by CreatedAt Date ---');
    console.table(createdGroups);
}
analyzeBillNumbers();
