import { getSupabaseServer } from "./src/lib/supabase/server";
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function check() {
    const supabase = getSupabaseServer();
    const { data, error } = await supabase
        .from('businessSettings')
        .select('*')
        .limit(1)
        .single();

    if (error) {
        console.error("Error:", error.message);
        return;
    }

    console.log("Columns found in businessSettings:");
    console.log(Object.keys(data).sort());
}

check();
