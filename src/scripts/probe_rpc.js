
const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function probe() {
    console.log("Probing exec_sql RPC...");
    const { data, error } = await supabase.rpc("exec_sql", {
        sql: "SELECT 1 as val"
    });

    if (error) {
        console.error("Probe failed:", error);
    } else {
        console.log("Probe success:", data);
    }
}

probe();
