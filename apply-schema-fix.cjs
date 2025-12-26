const { createClient } = require("@supabase/supabase-js");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function applySchemaFix() {
  console.log("🚀 Applying schema fix...");

  try {
    const sqlFilePath = path.join(__dirname, 'complete-schema-fix.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log("📄 Read SQL file: complete-schema-fix.sql");

    const { error } = await supabase.rpc("exec_sql", {
      sql: sqlContent,
    });

    if (error) {
      console.error("❌ Error applying schema fix:", error);
      return;
    }

    console.log("✅ Schema fix applied successfully!");
    console.log("Please restart your application to see the changes.");

  } catch (error) {
    console.error("❌ Unexpected error during schema fix application:", error);
    process.exit(1);
  }
}

applySchemaFix().catch(console.error);
