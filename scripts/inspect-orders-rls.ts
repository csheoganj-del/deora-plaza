import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

async function inspectPolicies() {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    console.log("Fetching RLS policies for 'orders' table...");
    const { data, error } = await supabase.rpc('get_policies', { table_name: 'orders' });

    // If rpc fails, try querying pg_policies
    if (error) {
        console.log("RPC 'get_policies' not found, trying direct query...");
        const { data: pgData, error: pgError } = await supabase.from('pg_policies').select('*').eq('tablename', 'orders');
        if (pgError) {
            // Fallback to checking from information_schema via a raw query if possible, 
            // but service role can usually see everything.
            console.log("Could not fetch policies directly. Trying to infer from a test query.");
        } else {
            console.log("Policies:", pgData);
        }
    } else {
        console.log("Policies:", data);
    }

    // Also check public access
    console.log("\nTesting public access to 'orders' table...");
    const publicSupabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data: publicData, error: publicError } = await publicSupabase.from('orders').select('id').limit(1);
    if (publicError) {
        console.log("Public access error:", publicError.message);
    } else {
        console.log("Public access successful! Data count:", publicData?.length);
    }
}

inspectPolicies();
