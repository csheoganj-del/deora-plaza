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

async function checkColumns() {
    const { data, error } = await supabase.rpc('get_table_columns', { table_name: 'bills' });
    if (error) {
        // Fallback: select one and see keys
        const { data: sample } = await supabase.from('bills').select('*').limit(1);
        if (sample && sample[0]) {
            console.log('Columns in bills:', Object.keys(sample[0]));
        }
    } else {
        console.log('Columns in bills:', data);
    }
}
checkColumns();
