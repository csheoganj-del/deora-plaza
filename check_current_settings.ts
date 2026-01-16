import * as dotenv from 'dotenv';
import path from 'path';
import { getSupabaseServer } from "./src/lib/supabase/server";

// Explicitly load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function run() {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
        .from('businessSettings')
        .select('*')
        .eq('id', 'default')
        .single();

    if (error) {
        console.error("Error fetching settings:", error.message);
    } else {
        console.log("Current Business Settings (default):", JSON.stringify(data, null, 2));
    }
}

run().catch(console.error);
