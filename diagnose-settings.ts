
import { supabaseServer } from "./src/lib/supabase/server";

async function diagnose() {
    console.log("🔍 Diagnosing businessSettings collection...");
    const { data, error } = await supabaseServer
        .from('businessSettings')
        .select('*');

    if (error) {
        console.error("❌ Error fetching businessSettings:", error);
        return;
    }

    console.log(`✅ Found ${data?.length || 0} documents:`);
    data?.forEach((doc, index) => {
        console.log(`\n--- Document ${index + 1} (ID: ${doc.id}) ---`);
        console.log(JSON.stringify(doc, null, 2));
    });
}

diagnose();
