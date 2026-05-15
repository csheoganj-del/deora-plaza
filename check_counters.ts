import * as dotenv from 'dotenv';
import path from 'path';
import { getSupabaseServer } from "./src/lib/supabase/server";

// Explicitly load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function run() {
    const supabase = getSupabaseServer();
    console.log("Checking for 'counters' table...");
    const { data, error } = await supabase.from('counters').select('*').limit(1);
    if (error) {
        console.error("Error accessing 'counters' table:", error.message);
    } else {
        console.log("Successfully accessed 'counters' table. Data:", data);
    }
}

run().catch(console.error);
