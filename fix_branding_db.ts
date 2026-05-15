import * as dotenv from 'dotenv';
import path from 'path';
import { getSupabaseServer } from "./src/lib/supabase/server";

// Explicitly load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function run() {
    const supabase = getSupabaseServer();
    const COLLECTION = "businessSettings"; // Case-sensitive table name
    const DOC_ID = "default";

    console.log(`Updating branding in table: ${COLLECTION} for ID: ${DOC_ID}...`);

    const updateData = {
        name: "DEORA PLAZA",
        address: "Kesarpura Road, Sheoganj",
        mobile: "9001160228",
        updatedAt: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from(COLLECTION)
        .update(updateData)
        .eq("id", DOC_ID)
        .select();

    if (error) {
        console.error("❌ Error updating branding:", error.message);

        // Fallback: try different casing if the above fails
        console.log("Trying with lowercase table name 'businesssettings'...");
        const { data: data2, error: error2 } = await supabase
            .from("businesssettings")
            .update(updateData)
            .eq("id", DOC_ID)
            .select();

        if (error2) {
            console.error("❌ Error updating branding (lowercase):", error2.message);
        } else {
            console.log("✅ Successfully updated branding in 'businesssettings'!");
            console.log("Updated record:", data2);
        }
    } else {
        console.log("✅ Successfully updated branding in 'businessSettings'!");
        console.log("Updated record:", data);
    }
}

run().catch(console.error);
