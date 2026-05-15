import * as dotenv from 'dotenv';
import path from 'path';
import { getSupabaseServer } from "./src/lib/supabase/server";

// Explicitly load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function run() {
    const supabase = getSupabaseServer();

    console.log("Checking columns for 'businessSettings'...");
    const { data: cols, error: err } = await supabase.rpc('get_table_columns', { table_name: 'businessSettings' });

    if (err) {
        console.log("RPC failed, trying raw query...");
        const { data, error } = await supabase.from('information_schema.columns')
            .select('column_name, data_type')
            .eq('table_name', 'businessSettings')
            .eq('table_schema', 'public');

        if (error) {
            console.error("Error fetching columns:", error.message);
        } else {
            console.log("Columns in businessSettings:", data);
        }
    } else {
        console.log("Columns in businessSettings:", cols);
    }
}

run().catch(console.error);
