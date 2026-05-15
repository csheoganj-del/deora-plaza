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

async function check() {
    const { count: bCount } = await supabase.from('bills').select('*', { count: 'exact', head: true });
    const { count: oCount } = await supabase.from('orders').select('*', { count: 'exact', head: true });
    console.log(`TOTAL_BILLS: ${bCount}`);
    console.log(`TOTAL_ORDERS: ${oCount}`);

    const { data: latestOrders } = await supabase.from('orders').select('id, createdAt, businessUnit').order('createdAt', { ascending: false }).limit(5);
    console.log('LATEST_ORDERS:', JSON.stringify(latestOrders, null, 2));
}
check();
