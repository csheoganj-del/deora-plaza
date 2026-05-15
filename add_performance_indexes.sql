-- Performance Optimization: Universal Safe Indexes
-- Checks for column existence before creating any index

-- Enable trigram extension for fuzzy text search (safe to run multiple times)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Customers table indexes (with column checks)
DO $$
BEGIN
  -- Check for mobile_number column
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'mobile_number'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_customers_mobile_number ON customers(mobile_number);
  END IF;

  -- Check for mobile column (alternative name)
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'mobile'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_customers_mobile ON customers(mobile);
  END IF;

  -- Check for name column with trigram
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'customers' AND column_name = 'name'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_customers_name_trgm ON customers USING gin(name gin_trgm_ops);
  END IF;
END $$;

-- Bills table indexes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bills' AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_bills_created_at_desc ON bills(created_at DESC);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'bills' AND column_name = 'customer_mobile'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_bills_customer_mobile ON bills(customer_mobile);
  END IF;
END $$;

-- Orders table indexes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'status'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
  END IF;

  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'orders' AND column_name = 'created_at'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_orders_created_at_desc ON orders(created_at DESC);
  END IF;
END $$;

-- Running Orders table indexes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'running_orders' AND column_name = 'table_id'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_running_orders_table_id ON running_orders(table_id);
  END IF;
END $$;

-- Menu Items table indexes
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'menu_items' AND column_name = 'category'
  ) THEN
    CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(category);
  END IF;
END $$;

-- ANALYZE tables (safe even if they don't exist - will just skip)
DO $$
BEGIN
  EXECUTE 'ANALYZE customers';
  EXECUTE 'ANALYZE bills';
  EXECUTE 'ANALYZE orders';
EXCEPTION WHEN OTHERS THEN
  -- Ignore errors from ANALYZE
  NULL;
END $$;

-- Success message
SELECT 'Performance indexes created successfully! 🚀' as status;
