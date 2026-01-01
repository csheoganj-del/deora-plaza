const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function fixDatabase() {
  console.log("🚀 Starting simplified database schema fix for DEORA...\n");

  try {
    // Check current tables
    console.log("🔍 Checking current database structure...");

    const { data: tables, error: tablesError } = await supabase
      .from("information_schema.tables")
      .select("table_name")
      .eq("table_schema", "public");

    if (tablesError) {
      console.error("❌ Error checking tables:", tablesError);
      return;
    }

    const existingTables = tables?.map((t) => t.table_name) || [];
    console.log(
      "📋 Existing tables:",
      existingTables.length > 0 ? existingTables.join(", ") : "None",
    );

    // Check if orders table exists and get its columns
    const hasOrdersTable = existingTables.includes("orders");

    if (hasOrdersTable) {
      console.log("\n🔍 Checking orders table columns...");

      const { data: columns, error: columnsError } = await supabase
        .from("information_schema.columns")
        .select("column_name, data_type, is_nullable")
        .eq("table_schema", "public")
        .eq("table_name", "orders");

      if (columnsError) {
        console.error("❌ Error checking orders columns:", columnsError);
        return;
      }

      const existingColumns = columns?.map(col => col.column_name) || [];
      console.log("📋 Existing orders columns:", existingColumns.join(", "));

      // Check for missing critical columns
      const requiredColumns = [
        "orderNumber", "tableNumber", "roomNumber", "source",
        "totalAmount", "isPaid", "guestCount", "settlementStatus",
        "pendingAt", "preparingAt", "readyAt", "servedAt", "completedAt",
        "timeline", "billId", "bookingId"
      ];

      const missingColumns = requiredColumns.filter(col => !existingColumns.includes(col));

      if (missingColumns.length > 0) {
        console.log("❌ Missing columns in orders table:", missingColumns.join(", "));
        console.log("\n⚠️ MANUAL ACTION REQUIRED:");
        console.log("Please run the following SQL commands in Supabase SQL Editor:");
        console.log("Go to: Dashboard → Database → SQL Editor\n");

        console.log("```sql");
        console.log("-- Add missing columns to orders table");
        console.log("ALTER TABLE public.orders");

        const alterStatements = [];
        if (missingColumns.includes("orderNumber")) alterStatements.push(`ADD COLUMN IF NOT EXISTS "orderNumber" TEXT`);
        if (missingColumns.includes("tableNumber")) alterStatements.push(`ADD COLUMN IF NOT EXISTS "tableNumber" TEXT`);
        if (missingColumns.includes("roomNumber")) alterStatements.push(`ADD COLUMN IF NOT EXISTS "roomNumber" TEXT`);
        if (missingColumns.includes("source")) alterStatements.push(`ADD COLUMN IF NOT EXISTS "source" TEXT DEFAULT 'pos'`);
        if (missingColumns.includes("totalAmount")) alterStatements.push(`ADD COLUMN IF NOT EXISTS "totalAmount" NUMERIC(10,2) DEFAULT 0`);
        if (missingColumns.includes("isPaid")) alterStatements.push(`ADD COLUMN IF NOT EXISTS "isPaid" BOOLEAN DEFAULT false`);
        if (missingColumns.includes("guestCount")) alterStatements.push(`ADD COLUMN IF NOT EXISTS "guestCount" INTEGER DEFAULT 0`);
        if (missingColumns.includes("settlementStatus")) alterStatements.push(`ADD COLUMN IF NOT EXISTS "settlementStatus" TEXT DEFAULT 'not-required'`);
        if (missingColumns.includes("pendingAt")) alterStatements.push(`ADD COLUMN IF NOT EXISTS "pendingAt" TIMESTAMP WITH TIME ZONE`);
        if (missingColumns.includes("preparingAt")) alterStatements.push(`ADD COLUMN IF NOT EXISTS "preparingAt" TIMESTAMP WITH TIME ZONE`);
        if (missingColumns.includes("readyAt")) alterStatements.push(`ADD COLUMN IF NOT EXISTS "readyAt" TIMESTAMP WITH TIME ZONE`);
        if (missingColumns.includes("servedAt")) alterStatements.push(`ADD COLUMN IF NOT EXISTS "servedAt" TIMESTAMP WITH TIME ZONE`);
        if (missingColumns.includes("completedAt")) alterStatements.push(`ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP WITH TIME ZONE`);
        if (missingColumns.includes("timeline")) alterStatements.push(`ADD COLUMN IF NOT EXISTS "timeline" JSONB DEFAULT '[]'::jsonb`);
        if (missingColumns.includes("billId")) alterStatements.push(`ADD COLUMN IF NOT EXISTS "billId" UUID`);
        if (missingColumns.includes("bookingId")) alterStatements.push(`ADD COLUMN IF NOT EXISTS "bookingId" UUID`);

        console.log(alterStatements.join(",\n"));
        console.log(";");

        console.log("\n-- Update existing orders with order numbers");
        console.log(`UPDATE public.orders`);
        console.log(`SET "orderNumber" = 'ORD-' || EXTRACT(EPOCH FROM "createdAt")::bigint::text`);
        console.log(`WHERE "orderNumber" IS NULL OR "orderNumber" = '';`);

        console.log("\n-- Set pendingAt for existing orders");
        console.log(`UPDATE public.orders`);
        console.log(`SET "pendingAt" = "createdAt"`);
        console.log(`WHERE "pendingAt" IS NULL AND "createdAt" IS NOT NULL;`);

        console.log("\n-- Set timeline for existing orders");
        console.log(`UPDATE public.orders`);
        console.log(`SET "timeline" = jsonb_build_array(`);
        console.log(`  jsonb_build_object(`);
        console.log(`    'status', 'pending',`);
        console.log(`    'timestamp', "createdAt",`);
        console.log(`    'actor', 'system',`);
        console.log(`    'message', 'Order placed'`);
        console.log(`  )`);
        console.log(`)`);
        console.log(`WHERE ("timeline" IS NULL OR "timeline" = '[]'::jsonb) AND "createdAt" IS NOT NULL;`);

        console.log("\n-- Create indexes for better performance");
        console.log(`CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders("orderNumber");`);
        console.log(`CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders("status");`);
        console.log(`CREATE INDEX IF NOT EXISTS idx_orders_business_unit ON public.orders("businessUnit");`);
        console.log(`CREATE INDEX IF NOT EXISTS idx_orders_completed_at ON public.orders("completedAt");`);
        console.log("```\n");

      } else {
        console.log("✅ All required columns exist in orders table");
      }
    } else {
      console.log("\n❌ Orders table doesn't exist!");
      console.log("Please create the orders table first using the complete SQL schema.");
    }

    // Check for other critical tables
    console.log("\n🔍 Checking for other required tables...");

    const requiredTables = [
      "users", "bills", "menu_items", "customers", "tables",
      "notifications", "businessSettings", "counters"
    ];

    const missingTables = requiredTables.filter(table => !existingTables.includes(table.toLowerCase()));

    if (missingTables.length > 0) {
      console.log("❌ Missing tables:", missingTables.join(", "));
      console.log("\n⚠️ CRITICAL: Missing essential tables!");
      console.log("Please run the complete database schema setup:");
      console.log("1. Go to Supabase Dashboard → Database → SQL Editor");
      console.log("2. Copy and paste the content from 'complete-database-schema.sql'");
      console.log("3. Click Run");
    } else {
      console.log("✅ All critical tables exist");
    }

    // Test basic operations
    console.log("\n🧪 Testing basic database operations...");

    try {
      // Test users table
      const { data: userCount, error: userError } = await supabase
        .from("users")
        .select("id", { count: "exact", head: true });

      if (userError) {
        console.log("⚠️ Users table issue:", userError.message);
      } else {
        console.log(`✅ Users table: ${userCount || 0} records`);
      }
    } catch (err) {
      console.log("⚠️ Users table not accessible");
    }

    try {
      // Test orders table
      const { data: orderCount, error: orderError } = await supabase
        .from("orders")
        .select("id", { count: "exact", head: true });

      if (orderError) {
        console.log("⚠️ Orders table issue:", orderError.message);
      } else {
        console.log(`✅ Orders table: ${orderCount || 0} records`);
      }
    } catch (err) {
      console.log("⚠️ Orders table not accessible");
    }

    try {
      // Test notifications table (this is often missing)
      const { data: notifCount, error: notifError } = await supabase
        .from("notifications")
        .select("id", { count: "exact", head: true });

      if (notifError) {
        console.log("❌ Notifications table missing or has issues");
        console.log("\n📝 To create notifications table, run this SQL:");
        console.log("```sql");
        console.log("CREATE TABLE IF NOT EXISTS public.notifications (");
        console.log("  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),");
        console.log('  "type" TEXT NOT NULL,');
        console.log('  "businessUnit" TEXT,');
        console.log('  "message" TEXT NOT NULL,');
        console.log('  "title" TEXT NOT NULL,');
        console.log('  "recipient" TEXT NOT NULL,');
        console.log('  "metadata" JSONB DEFAULT \'{}\'::jsonb,');
        console.log('  "isRead" BOOLEAN DEFAULT false,');
        console.log('  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),');
        console.log('  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()');
        console.log(");");
        console.log("");
        console.log("-- Enable RLS");
        console.log("ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;");
        console.log("```\n");
      } else {
        console.log(`✅ Notifications table: ${notifCount || 0} records`);
      }
    } catch (err) {
      console.log("❌ Notifications table missing");
    }

    // Final recommendations
    console.log("\n📋 SUMMARY AND NEXT STEPS:");
    console.log("================================");

    if (missingColumns && missingColumns.length > 0) {
      console.log("🔧 IMMEDIATE ACTION REQUIRED:");
      console.log("1. Copy the SQL commands shown above");
      console.log("2. Go to Supabase Dashboard → Database → SQL Editor");
      console.log("3. Paste and run the SQL commands");
      console.log("4. Restart your application: npm run dev");
      console.log("");
    }

    if (missingTables.length > 0) {
      console.log("🔧 COMPLETE SETUP NEEDED:");
      console.log("1. Run the complete database schema from 'complete-database-schema.sql'");
      console.log("2. This will create all missing tables and structures");
      console.log("");
    }

    console.log("✨ VERIFICATION:");
    console.log("After running the SQL commands, test your application:");
    console.log("1. npm run dev");
    console.log("2. Try creating a new order");
    console.log("3. Check that error messages are readable (not [object Object])");
    console.log("");

    console.log("🎯 The main issues fixed:");
    console.log("✅ Error message display (code already updated)");
    console.log("⏳ Database schema (needs manual SQL execution)");
    console.log("⏳ Missing columns in orders table (needs manual SQL execution)");

  } catch (error) {
    console.error("❌ Unexpected error during database check:", error);
    console.log("\n🔧 ALTERNATIVE SOLUTION:");
    console.log("If this script continues to fail, manually run the SQL schema:");
    console.log("1. Open complete-database-schema.sql");
    console.log("2. Copy all contents");
    console.log("3. Paste in Supabase SQL Editor");
    console.log("4. Click Run");
  }
}

// Run the database fix
fixDatabase().catch(console.error);
