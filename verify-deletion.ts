
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function verifyDeletionLogic() {
    console.log("🔒 Starting Deletion Logic Verification...");

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const DELETION_PASSWORD = process.env.ADMIN_DELETION_PASSWORD;

    if (!supabaseUrl || !supabaseKey || !DELETION_PASSWORD) {
        console.error("Missing env vars");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // 1. Check Business Settings
    console.log("\n1️⃣ Checking Business Settings...");
    const { data: settings } = await supabase.from('business_settings').select('*').single();
    console.log("Settings:", settings);

    const isEnabled = settings?.enablePasswordProtection ?? true;
    console.log(`Password Protection Enabled (DB): ${isEnabled}`);

    // 2. Simulate User Role Logic (Garden delete bypass?)
    console.log("\n2️⃣ Checking Admin Password...");
    console.log(`Env Password Length: ${DELETION_PASSWORD.length}`);
    console.log(`🔑 PASSWORD IS: [${DELETION_PASSWORD}]`);

    console.log("\n3️⃣ Cleanup...");
    // Cleanup
    // Nothing to cleanup as we didn't insert anything this run
}

verifyDeletionLogic();
