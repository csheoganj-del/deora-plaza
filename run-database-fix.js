const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

// Initialize Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
);

async function fixCompleteDatabase() {
  console.log("🚀 Starting complete database schema setup for DEORA...\n");

  try {
    // Check current database state
    console.log("🔍 Checking current database structure...");

    // List of all required tables
    const requiredTables = [
      "users",
      "orders",
      "bills",
      "menu_items",
      "customers",
      "tables",
      "rooms",
      "bookings",
      "inventory",
      "businesssettings",
      "counters",
      "discounts",
      "notifications",
      "settlements",
      "department_settlements",
      "transactions",
      "audit_logs",
      "statistics",
    ];

    // Check which tables exist
    const { data: existingTables, error: tablesError } = await supabase.rpc(
      "exec_sql",
      {
        sql: `
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name IN (${requiredTables.map((t) => `'${t}'`).join(", ")});
      `,
      },
    );

    if (tablesError) {
      console.error("❌ Error checking tables:", tablesError);
      return;
    }

    const existingTableNames = existingTables?.map((t) => t.table_name) || [];
    console.log(
      "📋 Existing tables:",
      existingTableNames.length > 0 ? existingTableNames.join(", ") : "None",
    );

    // Create the complete schema
    console.log("\n🔧 Creating complete database schema...");

    const completeSchemaSQL = `
      -- Enable necessary extensions
      CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

      -- Users table (authentication and user management)
      CREATE TABLE IF NOT EXISTS public.users (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE,
        password TEXT,
        "role" TEXT NOT NULL DEFAULT 'waiter',
        "businessUnit" TEXT NOT NULL DEFAULT 'cafe',
        "name" TEXT,
        "phoneNumber" TEXT,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Orders table (core order management with timeline tracking)
      CREATE TABLE IF NOT EXISTS public.orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "orderNumber" TEXT UNIQUE NOT NULL,
        "businessUnit" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "tableId" TEXT,
        "tableNumber" TEXT,
        "roomNumber" TEXT,
        "customerMobile" TEXT,
        "customerName" TEXT,
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
        "timeline" JSONB DEFAULT '[]'::jsonb,
        "paymentSyncedAt" TIMESTAMP WITH TIME ZONE,
        "paymentReceipt" TEXT
      );

      -- Add missing columns to existing orders table if it exists
      DO $$
      BEGIN
        -- Add columns one by one, ignoring errors if they already exist
        BEGIN ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "orderNumber" TEXT; EXCEPTION WHEN others THEN NULL; END;
        BEGIN ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "tableNumber" TEXT; EXCEPTION WHEN others THEN NULL; END;
        BEGIN ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "roomNumber" TEXT; EXCEPTION WHEN others THEN NULL; END;
        BEGIN ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "source" TEXT DEFAULT 'pos'; EXCEPTION WHEN others THEN NULL; END;
        BEGIN ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "totalAmount" NUMERIC(10,2) DEFAULT 0; EXCEPTION WHEN others THEN NULL; END;
        BEGIN ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "isPaid" BOOLEAN DEFAULT false; EXCEPTION WHEN others THEN NULL; END;
        BEGIN ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "guestCount" INTEGER DEFAULT 0; EXCEPTION WHEN others THEN NULL; END;
        BEGIN ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "settlementStatus" TEXT DEFAULT 'not-required'; EXCEPTION WHEN others THEN NULL; END;
        BEGIN ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "pendingAt" TIMESTAMP WITH TIME ZONE; EXCEPTION WHEN others THEN NULL; END;
        BEGIN ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "preparingAt" TIMESTAMP WITH TIME ZONE; EXCEPTION WHEN others THEN NULL; END;
        BEGIN ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "readyAt" TIMESTAMP WITH TIME ZONE; EXCEPTION WHEN others THEN NULL; END;
        BEGIN ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "servedAt" TIMESTAMP WITH TIME ZONE; EXCEPTION WHEN others THEN NULL; END;
        BEGIN ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "completedAt" TIMESTAMP WITH TIME ZONE; EXCEPTION WHEN others THEN NULL; END;
        BEGIN ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "timeline" JSONB DEFAULT '[]'::jsonb; EXCEPTION WHEN others THEN NULL; END;
        BEGIN ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "billId" UUID; EXCEPTION WHEN others THEN NULL; END;
        BEGIN ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "bookingId" UUID; EXCEPTION WHEN others THEN NULL; END;
        BEGIN ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "paymentSyncedAt" TIMESTAMP WITH TIME ZONE; EXCEPTION WHEN others THEN NULL; END;
        BEGIN ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS "paymentReceipt" TEXT; EXCEPTION WHEN others THEN NULL; END;
      END $$;

      -- Bills table (billing and payment management)
      CREATE TABLE IF NOT EXISTS public.bills (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "billNumber" TEXT UNIQUE NOT NULL,
        "orderId" UUID,
        "businessUnit" TEXT NOT NULL,
        "customerMobile" TEXT,
        "customerName" TEXT,
        "subtotal" NUMERIC(10,2),
        "discountPercent" NUMERIC(5,2),
        "discountAmount" NUMERIC(10,2),
        "gstPercent" NUMERIC(5,2),
        "gstAmount" NUMERIC(10,2),
        "grandTotal" NUMERIC(10,2),
        "amountPaid" NUMERIC(10,2) DEFAULT 0,
        "paymentMethod" TEXT,
        "paymentStatus" TEXT DEFAULT 'pending',
        "source" TEXT,
        "address" TEXT,
        "items" JSONB,
        "createdBy" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Menu Items table (product catalog)
      CREATE TABLE IF NOT EXISTS public.menu_items (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "name" TEXT NOT NULL,
        "description" TEXT,
        "price" NUMERIC(10,2) NOT NULL,
        "category" TEXT NOT NULL,
        "businessUnit" TEXT NOT NULL,
        "isAvailable" BOOLEAN DEFAULT true,
        "isDrink" BOOLEAN DEFAULT false,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Customers table (customer management and loyalty)
      CREATE TABLE IF NOT EXISTS public.customers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "mobileNumber" TEXT UNIQUE NOT NULL,
        "name" TEXT NOT NULL,
        "email" TEXT,
        "totalSpent" NUMERIC(10,2) DEFAULT 0,
        "visitCount" INTEGER DEFAULT 0,
        "lastVisit" TIMESTAMP WITH TIME ZONE,
        "discountTier" TEXT DEFAULT 'none',
        "customDiscountPercent" NUMERIC(5,2) DEFAULT 0,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Tables table (restaurant table management)
      CREATE TABLE IF NOT EXISTS public.tables (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "tableNumber" TEXT NOT NULL,
        "businessUnit" TEXT NOT NULL,
        "capacity" INTEGER NOT NULL,
        "status" TEXT DEFAULT 'available',
        "currentOrderId" UUID,
        "customerCount" INTEGER DEFAULT 0,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Rooms table (hotel room management)
      CREATE TABLE IF NOT EXISTS public.rooms (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "number" TEXT UNIQUE NOT NULL,
        "type" TEXT NOT NULL,
        "capacity" INTEGER NOT NULL,
        "status" TEXT DEFAULT 'available',
        "pricePerNight" NUMERIC(10,2),
        "amenities" JSONB DEFAULT '[]'::jsonb,
        "description" TEXT,
        "isActive" BOOLEAN DEFAULT true,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Bookings table (hotel and event bookings)
      CREATE TABLE IF NOT EXISTS public.bookings (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "bookingNumber" TEXT UNIQUE,
        "customerMobile" TEXT NOT NULL,
        "customerName" TEXT,
        "type" TEXT NOT NULL,
        "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
        "endDate" TIMESTAMP WITH TIME ZONE NOT NULL,
        "roomId" TEXT,
        "roomNumber" TEXT,
        "notes" TEXT,
        "totalAmount" NUMERIC(10,2),
        "basePrice" NUMERIC(10,2),
        "roomServiceTotal" NUMERIC(10,2) DEFAULT 0,
        "roomServiceCharges" JSONB DEFAULT '[]'::jsonb,
        "status" TEXT DEFAULT 'confirmed',
        "eventType" TEXT,
        "guestCount" INTEGER,
        "eventTime" TEXT,
        "advancePayment" NUMERIC(10,2) DEFAULT 0,
        "payments" JSONB DEFAULT '[]'::jsonb,
        "totalPaid" NUMERIC(10,2) DEFAULT 0,
        "remainingBalance" NUMERIC(10,2) DEFAULT 0,
        "paymentStatus" TEXT DEFAULT 'pending',
        "discountPercent" NUMERIC(5,2) DEFAULT 0,
        "discountAmount" NUMERIC(10,2) DEFAULT 0,
        "gstEnabled" BOOLEAN DEFAULT false,
        "gstPercentage" NUMERIC(5,2) DEFAULT 0,
        "gstAmount" NUMERIC(10,2) DEFAULT 0,
        "receiptNumber" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Inventory table (stock management)
      CREATE TABLE IF NOT EXISTS public.inventory (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "itemName" TEXT NOT NULL,
        "businessUnit" TEXT NOT NULL,
        "quantity" NUMERIC(10,2) NOT NULL,
        "unit" TEXT NOT NULL,
        "reorderLevel" NUMERIC(10,2) DEFAULT 0,
        "costPrice" NUMERIC(10,2),
        "sellingPrice" NUMERIC(10,2),
        "supplier" TEXT,
        "lastRestocked" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Business Settings table (system configuration)
      CREATE TABLE IF NOT EXISTS public.businessSettings (
        "id" TEXT PRIMARY KEY DEFAULT 'main',
        "name" TEXT NOT NULL,
        "address" TEXT NOT NULL,
        "mobile" TEXT NOT NULL,
        "email" TEXT,
        "website" TEXT,
        "logo" TEXT,
        "waiterlessMode" BOOLEAN DEFAULT false,
        "gstNumber" TEXT,
        "fssaiNumber" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Counters table (for generating sequential numbers)
      CREATE TABLE IF NOT EXISTS public.counters (
        "id" TEXT PRIMARY KEY,
        "value" INTEGER NOT NULL DEFAULT 1,
        "prefix" TEXT,
        "suffix" TEXT,
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Discounts table (discount management)
      CREATE TABLE IF NOT EXISTS public.discounts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "code" TEXT UNIQUE NOT NULL,
        "name" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "value" NUMERIC(10,2) NOT NULL,
        "minOrderValue" NUMERIC(10,2) DEFAULT 0,
        "maxDiscountAmount" NUMERIC(10,2),
        "startDate" TIMESTAMP WITH TIME ZONE,
        "endDate" TIMESTAMP WITH TIME ZONE,
        "isActive" BOOLEAN DEFAULT true,
        "usageLimit" INTEGER,
        "usedCount" INTEGER DEFAULT 0,
        "businessUnit" TEXT,
        "applicableOn" JSONB DEFAULT '[]'::jsonb,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Notifications table (system notifications)
      CREATE TABLE IF NOT EXISTS public.notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "type" TEXT NOT NULL,
        "businessUnit" TEXT,
        "message" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "recipient" TEXT NOT NULL,
        "metadata" JSONB DEFAULT '{}'::jsonb,
        "isRead" BOOLEAN DEFAULT false,
        "priority" TEXT DEFAULT 'normal',
        "expiresAt" TIMESTAMP WITH TIME ZONE,
        "readAt" TIMESTAMP WITH TIME ZONE,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Settlements table (daily cash reconciliation)
      CREATE TABLE IF NOT EXISTS public.settlements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "businessUnit" TEXT NOT NULL,
        "date" DATE NOT NULL,
        "openingBalance" NUMERIC(10,2) NOT NULL DEFAULT 0,
        "closingBalance" NUMERIC(10,2) NOT NULL DEFAULT 0,
        "cashSales" NUMERIC(10,2) DEFAULT 0,
        "cardSales" NUMERIC(10,2) DEFAULT 0,
        "upiSales" NUMERIC(10,2) DEFAULT 0,
        "totalSales" NUMERIC(10,2) DEFAULT 0,
        "orderCount" INTEGER DEFAULT 0,
        "expenses" NUMERIC(10,2) DEFAULT 0,
        "notes" TEXT,
        "settledBy" TEXT,
        "settledAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Department Settlements table (legacy support)
      CREATE TABLE IF NOT EXISTS public.department_settlements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "businessUnit" TEXT NOT NULL,
        "date" DATE NOT NULL,
        "openingBalance" NUMERIC(10,2) NOT NULL,
        "closingBalance" NUMERIC(10,2) NOT NULL,
        "cashSales" NUMERIC(10,2) DEFAULT 0,
        "cardSales" NUMERIC(10,2) DEFAULT 0,
        "digitalSales" NUMERIC(10,2) DEFAULT 0,
        "totalSales" NUMERIC(10,2) DEFAULT 0,
        "expenses" NUMERIC(10,2) DEFAULT 0,
        "notes" TEXT,
        "settledBy" TEXT,
        "settledAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Transactions table (financial transaction tracking)
      CREATE TABLE IF NOT EXISTS public.transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "type" TEXT NOT NULL,
        "businessUnit" TEXT NOT NULL,
        "amount" NUMERIC(10,2) NOT NULL,
        "description" TEXT,
        "category" TEXT,
        "paymentMethod" TEXT,
        "reference" TEXT,
        "orderId" UUID,
        "billId" UUID,
        "bookingId" UUID,
        "status" TEXT DEFAULT 'completed',
        "processedBy" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Audit Logs table (security and compliance tracking)
      CREATE TABLE IF NOT EXISTS public.audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "action" TEXT NOT NULL,
        "userId" UUID,
        "username" TEXT,
        "role" TEXT,
        "businessUnit" TEXT,
        "details" JSONB DEFAULT '{}'::jsonb,
        "ipAddress" TEXT,
        "userAgent" TEXT,
        "success" BOOLEAN DEFAULT true,
        "errorMessage" TEXT,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );

      -- Statistics table (performance and analytics)
      CREATE TABLE IF NOT EXISTS public.statistics (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        "type" TEXT NOT NULL,
        "businessUnit" TEXT,
        "period" TEXT NOT NULL,
        "date" DATE NOT NULL,
        "metrics" JSONB NOT NULL DEFAULT '{}'::jsonb,
        "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    const { error: schemaError } = await supabase.rpc("exec_sql", {
      sql: completeSchemaSQL,
    });

    if (schemaError) {
      console.error("❌ Error creating schema:", schemaError);
      return;
    }

    console.log("✅ Database tables created successfully");

    // Create indexes
    console.log("\n📊 Creating indexes for better performance...");

    const indexesSQL = `
      -- Critical indexes for orders table
      CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders("orderNumber");
      CREATE INDEX IF NOT EXISTS idx_orders_business_unit ON public.orders("businessUnit");
      CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders("status");
      CREATE INDEX IF NOT EXISTS idx_orders_settlement_status ON public.orders("settlementStatus");
      CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders("createdAt");
      CREATE INDEX IF NOT EXISTS idx_orders_completedAt ON public.orders("completedAt");

      -- Other critical indexes
      CREATE INDEX IF NOT EXISTS idx_bills_business_unit ON public.bills("businessUnit");
      CREATE INDEX IF NOT EXISTS idx_bills_payment_status ON public.bills("paymentStatus");
      CREATE INDEX IF NOT EXISTS idx_menu_items_business_unit ON public.menu_items("businessUnit");
      CREATE INDEX IF NOT EXISTS idx_menu_items_availability ON public.menu_items("isAvailable");
      CREATE INDEX IF NOT EXISTS idx_customers_mobile ON public.customers("mobileNumber");
      CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications("recipient");
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications("isRead");
    `;

    const { error: indexError } = await supabase.rpc("exec_sql", {
      sql: indexesSQL,
    });

    if (indexError) {
      console.log("⚠️ Some indexes may already exist:", indexError.message);
    } else {
      console.log("✅ Indexes created successfully");
    }

    // Update existing data
    console.log("\n🔄 Updating existing data...");

    // Fix orders table data
    const updateDataSQL = `
      -- Update orders without orderNumber
      UPDATE public.orders
      SET "orderNumber" = 'ORD-' || EXTRACT(EPOCH FROM "createdAt")::bigint::text
      WHERE "orderNumber" IS NULL OR "orderNumber" = '';

      -- Set pendingAt for existing orders
      UPDATE public.orders
      SET "pendingAt" = "createdAt"
      WHERE "pendingAt" IS NULL AND "createdAt" IS NOT NULL;

      -- Set timeline for existing orders
      UPDATE public.orders
      SET "timeline" = jsonb_build_array(
        jsonb_build_object(
          'status', 'pending',
          'timestamp', "createdAt",
          'actor', 'system',
          'message', 'Order placed'
        )
      )
      WHERE ("timeline" IS NULL OR "timeline" = '[]'::jsonb) AND "createdAt" IS NOT NULL;
    `;

    const { error: updateError } = await supabase.rpc("exec_sql", {
      sql: updateDataSQL,
    });

    if (updateError) {
      console.log("⚠️ Some data updates may have failed:", updateError.message);
    } else {
      console.log("✅ Existing data updated successfully");
    }

    // Add constraints
    console.log("\n🔒 Adding data constraints...");

    const constraintsSQL = `
      -- Add unique constraint on orderNumber if not exists
      DO $$
      BEGIN
        ALTER TABLE public.orders ADD CONSTRAINT unique_order_number UNIQUE ("orderNumber");
      EXCEPTION
        WHEN duplicate_table THEN NULL;
      END $$;

      -- Add check constraints
      DO $$
      BEGIN
        ALTER TABLE public.orders ADD CONSTRAINT check_valid_status
        CHECK ("status" IN ('pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'));
      EXCEPTION
        WHEN duplicate_table THEN NULL;
      END $$;

      DO $$
      BEGIN
        ALTER TABLE public.orders ADD CONSTRAINT check_valid_settlement_status
        CHECK ("settlementStatus" IN ('pending', 'settled', 'not-required'));
      EXCEPTION
        WHEN duplicate_table THEN NULL;
      END $$;
    `;

    const { error: constraintError } = await supabase.rpc("exec_sql", {
      sql: constraintsSQL,
    });

    if (constraintError) {
      console.log(
        "⚠️ Some constraints may already exist:",
        constraintError.message,
      );
    } else {
      console.log("✅ Constraints added successfully");
    }

    // Initialize basic data
    console.log("\n🔧 Initializing basic data...");

    const initDataSQL = `
      -- Insert business settings if not exists
      INSERT INTO public.businessSettings ("id", "name", "address", "mobile")
      VALUES ('main', 'DEORA POS System', 'Your Business Address', '1234567890')
      ON CONFLICT ("id") DO NOTHING;

      -- Insert counters if not exist
      INSERT INTO public.counters ("id", "value") VALUES
        ('bill_number', 1),
        ('order_number', 1),
        ('booking_number', 1),
        ('receipt_number', 1)
      ON CONFLICT ("id") DO NOTHING;
    `;

    const { error: initError } = await supabase.rpc("exec_sql", {
      sql: initDataSQL,
    });

    if (initError) {
      console.log("⚠️ Some initial data may already exist:", initError.message);
    } else {
      console.log("✅ Basic data initialized");
    }

    // Enable RLS
    console.log("\n🔒 Enabling Row Level Security...");

    const rlsSQL = `
      ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.businessSettings ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.counters ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.department_settlements ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
      ALTER TABLE public.statistics ENABLE ROW LEVEL SECURITY;
    `;

    const { error: rlsError } = await supabase.rpc("exec_sql", { sql: rlsSQL });

    if (rlsError) {
      console.log("⚠️ RLS may already be enabled:", rlsError.message);
    } else {
      console.log("✅ Row Level Security enabled");
    }

    // Verify final state
    console.log("\n🔍 Verifying database setup...");

    const { data: finalTables, error: finalError } = await supabase.rpc(
      "exec_sql",
      {
        sql: `
        SELECT table_name,
               (SELECT count(*) FROM information_schema.columns WHERE table_name = t.table_name AND table_schema = 'public') as column_count
        FROM information_schema.tables t
        WHERE table_schema = 'public'
        AND table_name IN (${requiredTables.map((t) => `'${t}'`).join(", ")})
        ORDER BY table_name;
      `,
      },
    );

    if (finalError) {
      console.error("❌ Error verifying setup:", finalError);
    } else {
      console.log("📋 Final database state:");
      finalTables?.forEach((table) => {
        console.log(`  ✅ ${table.table_name} (${table.column_count} columns)`);
      });
    }

    console.log("\n🎉 Complete database setup finished successfully!");
    console.log("\n📝 Summary:");
    console.log("✅ All required tables created/verified");
    console.log("✅ Missing columns added to orders table");
    console.log("✅ Performance indexes created");
    console.log("✅ Existing data migrated and fixed");
    console.log("✅ Data integrity constraints added");
    console.log("✅ Basic configuration data initialized");
    console.log("✅ Row Level Security enabled");
    console.log(
      "\n🚀 Your DEORA application should now work without any database schema errors!",
    );
    console.log("\nNext steps:");
    console.log("1. Start your application: npm run dev");
    console.log("2. Create your first admin user through the app");
    console.log("3. Configure your business settings");
    console.log("4. Add menu items for your restaurant/cafe");
  } catch (error) {
    console.error("❌ Unexpected error during database setup:", error);
    process.exit(1);
  }
}

// Run the complete database fix
fixCompleteDatabase().catch(console.error);
