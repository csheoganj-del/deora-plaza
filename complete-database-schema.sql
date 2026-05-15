-- Complete Database Schema for DEORA POS System
-- Run this in Supabase SQL Editor to create all required tables
-- This includes all tables referenced in the codebase

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

-- Categories table (product categorization)
CREATE TABLE IF NOT EXISTS public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL,
  parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  business_unit TEXT NOT NULL DEFAULT 'all',
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name, parent_id, business_unit)
);

-- Orders table (core order management with timeline tracking)
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "orderNumber" TEXT UNIQUE NOT NULL,
  "businessUnit" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "tableId" UUID,
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
  "categoryId" UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  "businessUnit" TEXT NOT NULL,
  "isAvailable" BOOLEAN DEFAULT true,
  "isDrink" BOOLEAN DEFAULT false,
  "measurement" TEXT,
  "measurementUnit" TEXT,
  "baseMeasurement" NUMERIC(10,2),
  "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comments for documentation
COMMENT ON COLUMN public.menu_items."measurement" IS 'The measurement for this item (e.g., 30ml, 150ml)';
COMMENT ON COLUMN public.menu_items."measurementUnit" IS 'The unit of measurement (e.g., ml, oz)';
COMMENT ON COLUMN public.menu_items."baseMeasurement" IS 'The base measurement size for the container (e.g., 750 for a 750ml bottle)';

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
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("tableNumber", "businessUnit")
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
  "roomId" UUID,
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
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("itemName", "businessUnit")
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
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("businessUnit", "date")
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
  "updatedAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE("type", "businessUnit", "period", "date")
);

-- Add Foreign Key Constraints (Critical for Data Integrity)
-- Orders relationships
ALTER TABLE public.orders 
  ADD CONSTRAINT fk_orders_booking FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_orders_bill FOREIGN KEY ("billId") REFERENCES public.bills(id) ON DELETE SET NULL;
  
-- Note: tableId in orders is currently TEXT, but tables.id is UUID. 
-- For strict integrity, tableId should be cast to UUID if it holds IDs.
-- Skipping explicit FK for tableId until type migration is performed to avoid errors.

-- Bills relationships
ALTER TABLE public.bills
  ADD CONSTRAINT fk_bills_order FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON DELETE SET NULL;

-- Transactions relationships
ALTER TABLE public.transactions
  ADD CONSTRAINT fk_transactions_order FOREIGN KEY ("orderId") REFERENCES public.orders(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_transactions_bill FOREIGN KEY ("billId") REFERENCES public.bills(id) ON DELETE SET NULL,
  ADD CONSTRAINT fk_transactions_booking FOREIGN KEY ("bookingId") REFERENCES public.bookings(id) ON DELETE SET NULL;

-- Create indexes for better performance
-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_username ON public.users("username");
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users("email");
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users("role");
CREATE INDEX IF NOT EXISTS idx_users_business_unit ON public.users("businessUnit");
CREATE INDEX IF NOT EXISTS idx_users_is_active ON public.users("isActive");

-- Orders table indexes
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders("orderNumber");
CREATE INDEX IF NOT EXISTS idx_orders_business_unit ON public.orders("businessUnit");
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders("status");
CREATE INDEX IF NOT EXISTS idx_orders_settlement_status ON public.orders("settlementStatus");
CREATE INDEX IF NOT EXISTS idx_orders_table_number ON public.orders("tableNumber");
CREATE INDEX IF NOT EXISTS idx_orders_room_number ON public.orders("roomNumber");
CREATE INDEX IF NOT EXISTS idx_orders_customer_mobile ON public.orders("customerMobile");
CREATE INDEX IF NOT EXISTS idx_orders_bill_id ON public.orders("billId");
CREATE INDEX IF NOT EXISTS idx_orders_booking_id ON public.orders("bookingId");
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders("createdAt");
CREATE INDEX IF NOT EXISTS idx_orders_pending_at ON public.orders("pendingAt");
CREATE INDEX IF NOT EXISTS idx_orders_preparing_at ON public.orders("preparingAt");
CREATE INDEX IF NOT EXISTS idx_orders_ready_at ON public.orders("readyAt");
CREATE INDEX IF NOT EXISTS idx_orders_served_at ON public.orders("servedAt");
CREATE INDEX IF NOT EXISTS idx_orders_completed_at ON public.orders("completedAt");

-- Bills table indexes
CREATE INDEX IF NOT EXISTS idx_bills_bill_number ON public.bills("billNumber");
CREATE INDEX IF NOT EXISTS idx_bills_order_id ON public.bills("orderId");
CREATE INDEX IF NOT EXISTS idx_bills_business_unit ON public.bills("businessUnit");
CREATE INDEX IF NOT EXISTS idx_bills_payment_status ON public.bills("paymentStatus");
CREATE INDEX IF NOT EXISTS idx_bills_customer_mobile ON public.bills("customerMobile");
CREATE INDEX IF NOT EXISTS idx_bills_created_at ON public.bills("createdAt");

-- Menu Items table indexes
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items("category");
CREATE INDEX IF NOT EXISTS idx_menu_items_business_unit ON public.menu_items("businessUnit");
CREATE INDEX IF NOT EXISTS idx_menu_items_availability ON public.menu_items("isAvailable");
CREATE INDEX IF NOT EXISTS idx_menu_items_name ON public.menu_items("name");
CREATE INDEX IF NOT EXISTS idx_menu_items_measurement ON public.menu_items("measurement");
CREATE INDEX IF NOT EXISTS idx_menu_items_measurement_unit ON public.menu_items("measurementUnit");

-- Customers table indexes
CREATE INDEX IF NOT EXISTS idx_customers_mobile ON public.customers("mobileNumber");
CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers("name");
CREATE INDEX IF NOT EXISTS idx_customers_discount_tier ON public.customers("discountTier");

-- Tables table indexes
CREATE INDEX IF NOT EXISTS idx_tables_business_unit ON public.tables("businessUnit");
CREATE INDEX IF NOT EXISTS idx_tables_status ON public.tables("status");
CREATE INDEX IF NOT EXISTS idx_tables_table_number ON public.tables("tableNumber");

-- Rooms table indexes
CREATE INDEX IF NOT EXISTS idx_rooms_number ON public.rooms("number");
CREATE INDEX IF NOT EXISTS idx_rooms_type ON public.rooms("type");
CREATE INDEX IF NOT EXISTS idx_rooms_status ON public.rooms("status");
CREATE INDEX IF NOT EXISTS idx_rooms_is_active ON public.rooms("isActive");

-- Bookings table indexes
CREATE INDEX IF NOT EXISTS idx_bookings_booking_number ON public.bookings("bookingNumber");
CREATE INDEX IF NOT EXISTS idx_bookings_customer_mobile ON public.bookings("customerMobile");
CREATE INDEX IF NOT EXISTS idx_bookings_type ON public.bookings("type");
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings("status");
CREATE INDEX IF NOT EXISTS idx_bookings_start_date ON public.bookings("startDate");
CREATE INDEX IF NOT EXISTS idx_bookings_end_date ON public.bookings("endDate");
CREATE INDEX IF NOT EXISTS idx_bookings_room_id ON public.bookings("roomId");
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings("createdAt");

-- Inventory table indexes
CREATE INDEX IF NOT EXISTS idx_inventory_business_unit ON public.inventory("businessUnit");
CREATE INDEX IF NOT EXISTS idx_inventory_item_name ON public.inventory("itemName");

-- Discounts table indexes
CREATE INDEX IF NOT EXISTS idx_discounts_code ON public.discounts("code");
CREATE INDEX IF NOT EXISTS idx_discounts_active ON public.discounts("isActive");
CREATE INDEX IF NOT EXISTS idx_discounts_business_unit ON public.discounts("businessUnit");
CREATE INDEX IF NOT EXISTS idx_discounts_start_date ON public.discounts("startDate");
CREATE INDEX IF NOT EXISTS idx_discounts_end_date ON public.discounts("endDate");

-- Notifications table indexes
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications("type");
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications("recipient");
CREATE INDEX IF NOT EXISTS idx_notifications_business_unit ON public.notifications("businessUnit");
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications("isRead");
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications("createdAt");
CREATE INDEX IF NOT EXISTS idx_notifications_expires_at ON public.notifications("expiresAt");

-- Settlements table indexes
CREATE INDEX IF NOT EXISTS idx_settlements_business_unit ON public.settlements("businessUnit");
CREATE INDEX IF NOT EXISTS idx_settlements_date ON public.settlements("date");
CREATE INDEX IF NOT EXISTS idx_settlements_created_at ON public.settlements("createdAt");

-- Department Settlements table indexes
CREATE INDEX IF NOT EXISTS idx_department_settlements_business_unit ON public.department_settlements("businessUnit");
CREATE INDEX IF NOT EXISTS idx_department_settlements_date ON public.department_settlements("date");

-- Transactions table indexes
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions("type");
CREATE INDEX IF NOT EXISTS idx_transactions_business_unit ON public.transactions("businessUnit");
CREATE INDEX IF NOT EXISTS idx_transactions_order_id ON public.transactions("orderId");
CREATE INDEX IF NOT EXISTS idx_transactions_bill_id ON public.transactions("billId");
CREATE INDEX IF NOT EXISTS idx_transactions_booking_id ON public.transactions("bookingId");
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions("createdAt");

-- Audit Logs table indexes
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON public.audit_logs("action");
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON public.audit_logs("userId");
CREATE INDEX IF NOT EXISTS idx_audit_logs_username ON public.audit_logs("username");
CREATE INDEX IF NOT EXISTS idx_audit_logs_business_unit ON public.audit_logs("businessUnit");
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs("createdAt");

-- Statistics table indexes
CREATE INDEX IF NOT EXISTS idx_statistics_type ON public.statistics("type");
CREATE INDEX IF NOT EXISTS idx_statistics_business_unit ON public.statistics("businessUnit");
CREATE INDEX IF NOT EXISTS idx_statistics_period ON public.statistics("period");
CREATE INDEX IF NOT EXISTS idx_statistics_date ON public.statistics("date");

-- Counters table indexes
CREATE INDEX IF NOT EXISTS idx_counters_id ON public.counters("id");

-- Add check constraints for data integrity
ALTER TABLE public.orders ADD CONSTRAINT check_valid_status
CHECK ("status" IN ('pending', 'preparing', 'ready', 'served', 'completed', 'cancelled'));

ALTER TABLE public.orders ADD CONSTRAINT check_valid_settlement_status
CHECK ("settlementStatus" IN ('pending', 'settled', 'not-required'));

ALTER TABLE public.orders ADD CONSTRAINT check_valid_type
CHECK ("type" IN ('dine-in', 'takeaway', 'delivery', 'room-service', 'bar'));

ALTER TABLE public.bills ADD CONSTRAINT check_valid_payment_status
CHECK ("paymentStatus" IN ('pending', 'paid', 'cancelled', 'refunded'));

ALTER TABLE public.bills ADD CONSTRAINT check_valid_payment_method
CHECK ("paymentMethod" IN ('cash', 'card', 'upi', 'online', 'credit'));

ALTER TABLE public.tables ADD CONSTRAINT check_valid_table_status
CHECK ("status" IN ('available', 'occupied', 'reserved', 'cleaning', 'maintenance'));

ALTER TABLE public.rooms ADD CONSTRAINT check_valid_room_status
CHECK ("status" IN ('available', 'occupied', 'maintenance', 'cleaning', 'out-of-order'));

-- Missing Foreign Keys for tableId and roomId
ALTER TABLE public.orders
  ADD CONSTRAINT fk_orders_table FOREIGN KEY ("tableId") REFERENCES public.tables(id) ON DELETE SET NULL;

ALTER TABLE public.bookings
  ADD CONSTRAINT fk_bookings_room FOREIGN KEY ("roomId") REFERENCES public.rooms(id) ON DELETE SET NULL;

