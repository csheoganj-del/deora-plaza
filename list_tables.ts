import * as dotenv from 'dotenv';
import path from 'path';
import { getSupabaseServer } from "./src/lib/supabase/server";

// Explicitly load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function run() {
    console.log("Supabase URL:", process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Missing");
    console.log("Supabase Service Key:", process.env.SUPABASE_SERVICE_ROLE_KEY ? "Set" : "Missing");

    const supabase = getSupabaseServer();

    console.log("Listing all tables in public schema...");
    const { data: tables, error: tableError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

    if (tableError) {
        console.error("Error listing tables via information_schema:", tableError);
    } else {
        console.log("Tables found:", tables.map(t => t.table_name).join(", "));
    }

    const possibleNames = ["businessSettings", "businesssettings", "business_settings"];

    for (const name of possibleNames) {
        console.log(`\nChecking table: ${name}`);
        const { data, error } = await supabase
            .from(name)
            .select("*")
            .limit(2);

        if (error) {
            console.log(`  Error querying ${name}:`, error.message);
        } else {
            console.log(`  Success! Found ${data.length} rows in ${name} (limited to 2 for sample)`);
            if (data && data.length > 0) {
                console.log(`  Columns in ${name}:`, Object.keys(data[0]));
                console.log(`  Data sample (first row partial):`, data[0]);
            }
        }
    }
}

run().catch(console.error);
