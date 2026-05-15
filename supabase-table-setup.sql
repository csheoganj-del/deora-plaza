-- Run these commands in the Supabase SQL Editor (Database > SQL Editor)

-- Create users table
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

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users("role");
CREATE INDEX IF NOT EXISTS idx_users_business_unit ON public.users("businessUnit");

-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "businessUnit" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "tableId" TEXT,
  "customerMobile" TEXT,
  "customerName" TEXT,
  "items" JSONB,
  "status" TEXT DEFAULT 'pending',
  "specialInstructions" TEXT,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for orders table
CREATE INDEX IF NOT EXISTS idx_orders_business_unit ON public.orders("businessUnit");
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders("status");
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders("createdAt");

-- Create bills table
CREATE TABLE IF NOT EXISTS public.bills (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
  "paymentMethod" TEXT,
  "paymentStatus" TEXT DEFAULT 'pending',
  "source" TEXT,
  "address" TEXT,
  "items" JSONB,
  "createdBy" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for bills table
CREATE INDEX IF NOT EXISTS idx_bills_business_unit ON public.bills("businessUnit");
CREATE INDEX IF NOT EXISTS idx_bills_payment_status ON public.bills("paymentStatus");
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON public.bills("createdAt");

-- Create menu_items table
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

-- Create unique constraint for menu_items
ALTER TABLE public.menu_items ADD CONSTRAINT unique_menu_item_name_business_unit UNIQUE ("name", "businessUnit");

-- Create indexes for menu_items table
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items("category");
CREATE INDEX IF NOT EXISTS idx_menu_items_business_unit ON public.menu_items("businessUnit");
CREATE INDEX IF NOT EXISTS idx_menu_items_availability ON public.menu_items("isAvailable");

-- Create customers table
CREATE TABLE IF NOT EXISTS public.customers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "mobileNumber" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "email" TEXT,
  "totalSpent" NUMERIC(10,2) DEFAULT 0,
  "visitCount" INTEGER DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for customers table
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON public.customers("mobileNumber");
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers("name");

-- Create tables table (for restaurant tables)
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

-- Create unique constraint for tables
ALTER TABLE public.tables ADD CONSTRAINT unique_table_number_business_unit UNIQUE ("tableNumber", "businessUnit");

-- Create indexes for tables table
CREATE INDEX IF NOT EXISTS idx_tables_business_unit ON public.tables("businessUnit");
CREATE INDEX IF NOT EXISTS idx_tables_status ON public.tables("status");

-- Create inventory table
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
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique constraint for inventory
ALTER TABLE public.inventory ADD CONSTRAINT unique_inventory_item_name_business_unit UNIQUE ("itemName", "businessUnit");

-- Create indexes for inventory table
CREATE INDEX IF NOT EXISTS idx_inventory_business_unit ON public.inventory("businessUnit");
CREATE INDEX IF NOT EXISTS idx_inventory_item_name ON public.inventory("itemName");

-- Create bookings table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "customerMobile" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "startDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "endDate" TIMESTAMP WITH TIME ZONE NOT NULL,
  "roomId" TEXT,
  "notes" TEXT,
  "totalAmount" NUMERIC(10,2),
  "status" TEXT DEFAULT 'confirmed',
  "eventType" TEXT,
  "guestCount" INTEGER,
  "eventTime" TEXT,
  "advancePayment" NUMERIC(10,2) DEFAULT 0,
  "payments" JSONB,
  "totalPaid" NUMERIC(10,2) DEFAULT 0,
  "remainingBalance" NUMERIC(10,2) DEFAULT 0,
  "paymentStatus" TEXT DEFAULT 'pending',
  "basePrice" NUMERIC(10,2),
  "discountPercent" NUMERIC(5,2) DEFAULT 0,
  "discountAmount" NUMERIC(10,2) DEFAULT 0,
  "gstEnabled" BOOLEAN DEFAULT false,
  "gstPercentage" NUMERIC(5,2) DEFAULT 0,
  "gstAmount" NUMERIC(10,2) DEFAULT 0,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for bookings table
CREATE INDEX IF NOT EXISTS idx_bookings_customer_mobile ON public.bookings("customerMobile");
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings("status");
CREATE INDEX IF NOT EXISTS idx_bookings_start_date ON public.bookings("startDate");
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings("createdAt");

-- Create counters table
CREATE TABLE IF NOT EXISTS public.counters (
  "id" TEXT PRIMARY KEY,
  "value" INTEGER NOT NULL DEFAULT 1,
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for counters table
CREATE INDEX IF NOT EXISTS idx_counters_id ON public.counters("id");

-- Create businessSettings table
CREATE TABLE IF NOT EXISTS public.businessSettings (
  "id" TEXT PRIMARY KEY,
  "name" TEXT NOT NULL,
  "address" TEXT NOT NULL,
  "mobile" TEXT NOT NULL,
  "waiterlessMode" BOOLEAN DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create discounts table
CREATE TABLE IF NOT EXISTS public.discounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "code" TEXT UNIQUE NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT NOT NULL, -- 'percentage' or 'fixed'
  "value" NUMERIC(10,2) NOT NULL,
  "minOrderValue" NUMERIC(10,2) DEFAULT 0,
  "maxDiscountAmount" NUMERIC(10,2),
  "startDate" TIMESTAMP WITH TIME ZONE,
  "endDate" TIMESTAMP WITH TIME ZONE,
  "isActive" BOOLEAN DEFAULT true,
  "usageLimit" INTEGER,
  "usedCount" INTEGER DEFAULT 0,
  "businessUnit" TEXT,
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for discounts table
CREATE INDEX IF NOT EXISTS idx_discounts_code ON public.discounts("code");
CREATE INDEX IF NOT EXISTS idx_discounts_active ON public.discounts("isActive");
CREATE INDEX IF NOT EXISTS idx_discounts_business_unit ON public.discounts("businessUnit");

-- Create department_settlements table
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

-- Create indexes for department_settlements table
CREATE INDEX IF NOT EXISTS idx_department_settlements_business_unit ON public.department_settlements("businessUnit");
CREATE INDEX IF NOT EXISTS idx_department_settlements_date ON public.department_settlements("date");

-- Enable RLS (Row Level Security) for all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bills ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.counters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.businessSettings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.department_settlements ENABLE ROW LEVEL SECURITY;