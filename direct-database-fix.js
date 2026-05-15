const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function testAndFixDatabase() {
  console.log("🚀 Testing DEORA database directly...\n");

  try {
    const results = {
      tablesExist: {},
      ordersColumns: [],
      issues: [],
      sqlToRun: [],
    };

    // Test each table directly
    const requiredTables = [
      "users",
      "orders",
      "bills",
      "menu_items",
      "customers",
      "tables",
      "notifications",
      "businessSettings",
      "counters",
    ];

    console.log("🔍 Testing table accessibility...");

    for (const tableName of requiredTables) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select("*")
          .limit(1);

        if (error) {
          console.log(`❌ ${tableName}: ${error.message}`);
          results.tablesExist[tableName] = false;
          results.issues.push(
            `Table '${tableName}' is missing or inaccessible`,
          );
        } else {
          console.log(`✅ ${tableName}: OK`);
          results.tablesExist[tableName] = true;
        }
      } catch (err) {
        console.log(`❌ ${tableName}: ${err.message}`);
        results.tablesExist[tableName] = false;
      }
    }

    // Test specific orders table columns by trying to select them
    if (results.tablesExist.orders) {
      console.log("\n🔍 Testing orders table columns...");

      const columnsToTest = [
        "id",
        "businessUnit",
        "type",
        "status",
        "createdAt",
        "updatedAt",
        "orderNumber",
        "tableNumber",
        "roomNumber",
        "source",
        "totalAmount",
        "isPaid",
        "guestCount",
        "settlementStatus",
        "pendingAt",
        "preparingAt",
        "readyAt",
        "servedAt",
        "completedAt",
        "timeline",
        "billId",
        "bookingId",
        "items",
      ];

      for (const column of columnsToTest) {
        try {
          const { data, error } = await supabase
            .from("orders")
            .select(column)
            .limit(1);

          if (error) {
            console.log(`❌ orders.${column}: Missing`);
            results.issues.push(`Column 'orders.${column}' is missing`);
          } else {
            console.log(`✅ orders.${column}: OK`);
            results.ordersColumns.push(column);
          }
        } catch (err) {
          console.log(`❌ orders.${column}: Error - ${err.message}`);
        }
      }
    }

    // Generate SQL fixes based on findings
    console.log("\n📋 ANALYSIS RESULTS:");
    console.log("====================");

    if (!results.tablesExist.orders) {
      console.log("❌ CRITICAL: Orders table is missing!");
      results.sqlToRun.push(`
-- Create orders table
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderNumber" TEXT UNIQUE NOT NULL,
  "businessUnit" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "tableId" TEXT,
  "tableNumber" TEXT,
  "roomNumber" TEXT,
  "customerMobile" TEXT,
  "items" JSONB,
  "status" TEXT DEFAULT 'pending',
  "settlementStatus" TEXT DEFAULT 'not-required',
  "totalAmount" NUMERIC(10,2) DEFAULT 0,
  "isPaid" BOOLEAN DEFAULT false,
  "guestCount" INTEGER DEFAULT 0,
  "source" TEXT DEFAULT 'pos',
  "specialInstructions" TEXT,
  "billId" UUID,
  "bookingId" UUID,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "pendingAt" TIMESTAMP WITH TIME ZONE,
  "preparingAt" TIMESTAMP WITH TIME ZONE,
  "readyAt" TIMESTAMP WITH TIME ZONE,
  "servedAt" TIMESTAMP WITH TIME ZONE,
  "completedAt" TIMESTAMP WITH TIME ZONE,
  "timeline" JSONB DEFAULT '[]'::jsonb
);`);
    }

    if (!results.tablesExist.notifications) {
      console.log("❌ Notifications table missing - needed for kitchen alerts");
      results.sqlToRun.push(`
-- Create notifications table
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "type" TEXT NOT NULL,
  "businessUnit" TEXT,
  "message" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "recipient" TEXT NOT NULL,
  "metadata" JSONB DEFAULT '{}'::jsonb,
  "isRead" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);`);
    }

    // Check for missing columns in existing orders table
    const criticalMissingColumns = [
      "orderNumber",
      "completedAt",
      "timeline",
      "settlementStatus",
      "totalAmount",
      "isPaid",
      "pendingAt",
      "preparingAt",
      "readyAt",
      "servedAt",
    ].filter((col) => !results.ordersColumns.includes(col));

    if (criticalMissingColumns.length > 0 && results.tablesExist.orders) {
      console.log(
        "❌ Missing critical columns in orders table:",
        criticalMissingColumns.join(", "),
      );

      const alterStatements = [];
      criticalMissingColumns.forEach((col) => {
        switch (col) {
          case "orderNumber":
            alterStatements.push(`ADD COLUMN IF NOT EXISTS "orderNumber" TEXT`);
            break;
          case "completedAt":
            alterStatements.push(
              `ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP WITH TIME ZONE`,
            );
            break;
          case "timeline":
            alterStatements.push(
              `ADD COLUMN IF NOT EXISTS "timeline" JSONB DEFAULT '[]'::jsonb`,
            );
            break;
          case "settlementStatus":
            alterStatements.push(
              `ADD COLUMN IF NOT EXISTS "settlementStatus" TEXT DEFAULT 'not-required'`,
            );
            break;
          case "totalAmount":
            alterStatements.push(
              `ADD COLUMN IF NOT EXISTS "totalAmount" NUMERIC(10,2) DEFAULT 0`,
            );
            break;
          case "isPaid":
            alterStatements.push(
              `ADD COLUMN IF NOT EXISTS "isPaid" BOOLEAN DEFAULT false`,
            );
            break;
          case "pendingAt":
            alterStatements.push(
              `ADD COLUMN IF NOT EXISTS "pendingAt" TIMESTAMP WITH TIME ZONE`,
            );
            break;
          case "preparingAt":
            alterStatements.push(
              `ADD COLUMN IF NOT EXISTS "preparingAt" TIMESTAMP WITH TIME ZONE`,
            );
            break;
          case "readyAt":
            alterStatements.push(
              `ADD COLUMN IF NOT EXISTS "readyAt" TIMESTAMP WITH TIME ZONE`,
            );
            break;
          case "servedAt":
            alterStatements.push(
              `ADD COLUMN IF NOT EXISTS "servedAt" TIMESTAMP WITH TIME ZONE`,
            );
            break;
        }
      });

      results.sqlToRun.push(`
-- Add missing columns to orders table
ALTER TABLE public.orders
${alterStatements.join(",\n")};`);

      results.sqlToRun.push(`
-- Update existing orders with missing data
UPDATE public.orders
SET "orderNumber" = 'ORD-' || EXTRACT(EPOCH FROM "createdAt")::bigint::text
WHERE "orderNumber" IS NULL OR "orderNumber" = '';

UPDATE public.orders
SET "pendingAt" = "createdAt"
WHERE "pendingAt" IS NULL AND "createdAt" IS NOT NULL;

UPDATE public.orders
SET "timeline" = jsonb_build_array(
  jsonb_build_object(
    'status', 'pending',
    'timestamp', "createdAt",
    'actor', 'system',
    'message', 'Order placed'
  )
)
WHERE ("timeline" IS NULL OR "timeline" = '[]'::jsonb) AND "createdAt" IS NOT NULL;`);
    }

    // Add indexes and constraints
    if (results.tablesExist.orders) {
      results.sqlToRun.push(`
-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders("orderNumber");
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders("status");
CREATE INDEX IF NOT EXISTS idx_orders_business_unit ON public.orders("businessUnit");
CREATE INDEX IF NOT EXISTS idx_orders_completed_at ON public.orders("completedAt");
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders("createdAt");

-- Add constraints
ALTER TABLE public.orders ADD CONSTRAINT IF NOT EXISTS check_valid_status
CHECK ("status" IN ('pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'));

ALTER TABLE public.orders ADD CONSTRAINT IF NOT EXISTS check_valid_settlement_status
CHECK ("settlementStatus" IN ('pending', 'settled', 'not-required'));`);
    }

    // Enable RLS
    results.sqlToRun.push(`
-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;`);

    // Display results
    console.log("\n🎯 ISSUES FOUND:", results.issues.length);
    results.issues.forEach((issue) => console.log(`   • ${issue}`));

    if (results.sqlToRun.length > 0) {
      console.log("\n🔧 SQL COMMANDS TO RUN:");
      console.log("=======================");
      console.log("Copy and paste the following SQL in Supabase SQL Editor:");
      console.log("(Dashboard → Database → SQL Editor)\n");

      results.sqlToRun.forEach((sql) => {
        console.log(sql);
        console.log("");
      });

      console.log("📋 STEPS TO FIX:");
      console.log("1. Go to your Supabase project dashboard");
      console.log("2. Navigate to Database → SQL Editor");
      console.log("3. Copy the SQL commands shown above");
      console.log("4. Paste them in the SQL Editor");
      console.log("5. Click 'Run' to execute");
      console.log("6. Restart your app: npm run dev");
    } else {
      console.log("✅ No critical issues found!");
      console.log("Your database schema appears to be correct.");
    }

    // Test a simple operation
    console.log("\n🧪 Testing basic operations...");

    if (results.tablesExist.orders) {
      try {
        const { data: orders, error } = await supabase
          .from("orders")
          .select("id, orderNumber, status, createdAt")
          .limit(5);

        if (error) {
          console.log("⚠️ Orders query test failed:", error.message);
        } else {
          console.log(
            `✅ Orders query test passed (${orders?.length || 0} records found)`,
          );
          if (orders && orders.length > 0) {
            console.log("   Sample order:", {
              id: orders[0].id?.substring(0, 8) + "...",
              orderNumber: orders[0].orderNumber,
              status: orders[0].status,
            });
          }
        }
      } catch (err) {
        console.log("❌ Orders query test error:", err.message);
      }
    }

    console.log("\n🎉 Analysis complete!");
    console.log(
      "\nThe main '[object Object]' error has been fixed in the code.",
    );
    console.log(
      "Run the SQL commands above to fix the 'completedAt' column error.",
    );
  } catch (error) {
    console.error("❌ Unexpected error:", error);
    console.log("\n🆘 EMERGENCY FIX:");
    console.log(
      "If this script fails, run this minimal SQL to fix the immediate error:",
    );
    console.log("");
    console.log(
      'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP WITH TIME ZONE;',
    );
    console.log(
      "ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS \"timeline\" JSONB DEFAULT '[]'::jsonb;",
    );
    console.log(
      'ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "orderNumber" TEXT;',
    );
    console.log("");
    console.log(
      'UPDATE public.orders SET "orderNumber" = \'ORD-\' || id WHERE "orderNumber" IS NULL;',
    );
  }
}

// Run the test
testAndFixDatabase().catch(console.error);
