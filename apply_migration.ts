import * as dotenv from 'dotenv';
import path from 'path';
import { getSupabaseServer } from "./src/lib/supabase/server";

// Explicitly load .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

async function run() {
    const supabase = getSupabaseServer();

    console.log("Adding missing columns to 'businessSettings'...");

    // We'll use multiple rpc or raw queries to ensure columns exist
    // Since we don't have a direct 'run_sql' RPC usually, we'll try to update a record
    // but better yet, we can use the 'updateDocument' logic if it was dynamic, 
    // but SQL is needed for adding columns.

    // Most Supabase projects have an 'exec_sql' or similar if configured, 
    // otherwise we might have to rely on the user to run it in the dashboard.
    // However, I will try to see if I can add them via a migration-like script
    // using a common RPC if available, or just report if I can't.

    // ALTER TABLE "businessSettings" 
    // ADD COLUMN IF NOT EXISTS "gardenName" TEXT,
    // ADD COLUMN IF NOT EXISTS "gardenAddress" TEXT,
    // ADD COLUMN IF NOT EXISTS "gardenMobile" TEXT,
    // ADD COLUMN IF NOT EXISTS "gardenGstNumber" TEXT;

    console.log("Please run the following SQL in your Supabase SQL Editor:");
    console.log(`
ALTER TABLE "businessSettings" 
ADD COLUMN IF NOT EXISTS "gardenName" TEXT,
ADD COLUMN IF NOT EXISTS "gardenAddress" TEXT,
ADD COLUMN IF NOT EXISTS "gardenMobile" TEXT,
ADD COLUMN IF NOT EXISTS "gardenGstNumber" TEXT;
    `);

    // Let's try to verify if we can do it via RPC 'exec_sql' if it exists
    const { error: rpcError } = await supabase.rpc('exec_sql', {
        sql_query: 'ALTER TABLE "businessSettings" ADD COLUMN IF NOT EXISTS "gardenName" TEXT, ADD COLUMN IF NOT EXISTS "gardenAddress" TEXT, ADD COLUMN IF NOT EXISTS "gardenMobile" TEXT, ADD COLUMN IF NOT EXISTS "gardenGstNumber" TEXT;'
    });

    if (rpcError) {
        console.log("RPC 'exec_sql' not found or failed. This is expected on many default setups.");
        console.log("Error details:", rpcError.message);
    } else {
        console.log("✅ Successfully added columns via RPC!");
    }
}

run().catch(console.error);
