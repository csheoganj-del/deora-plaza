
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: '.env.local' });
dotenv.config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error("Missing Supabase credentials in .env");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function inspectMenu() {
    console.log("Fetching last 5 menu items...");
    const { data, error } = await supabase
        .from("menu_items")
        .select("*")
        .limit(5);

    if (error) {
        console.error("Error fetching menu items:", error);
        return;
    }

    if (!data || data.length === 0) {
        console.log("No menu items found.");
        return;
    }

    console.log(`Found ${data.length} menu items.`);
    console.log("\nSample Menu Item Structure:");
    console.log(JSON.stringify(data[0], null, 2));

    if ('available' in data[0]) console.log("Column 'available' exists.");
    if ('isAvailable' in data[0]) console.log("Column 'isAvailable' exists.");
}

inspectMenu().catch(console.error);
