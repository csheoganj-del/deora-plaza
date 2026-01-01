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

async function checkTransactionsAndSettlements() {
    // Check if these bills have transactions
    const { data: transactions } = await supabase
        .from('transactions')
        .select('createdAt, billId')
        .not('billId', 'is', null)
        .limit(10);

    console.log('Sample Transactions with BillId:');
    console.table(transactions);

    const { count: tCount } = await supabase
        .from('transactions')
        .select('*', { count: 'exact', head: true });

    console.log('Total transactions:', tCount);

    const { data: settlements } = await supabase
        .from('settlements')
        .select('*')
        .limit(5);

    console.log('Sample Settlements:');
    console.table(settlements);
}
checkTransactionsAndSettlements();
