-- CRITICAL: Simple database security fixes (camelCase column names)
-- This version focuses on the most critical security issues first

-- Enable RLS on critical tables that are missing it
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

-- Remove dangerous public read policy if it exists
DROP POLICY IF EXISTS "Public read for tracking" ON user_locations;

-- Add basic constraints for data integrity
DO $$ 
BEGIN
    -- Add GST rate constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'check_gst_rate' AND table_name = 'bills') THEN
        ALTER TABLE bills ADD CONSTRAINT check_gst_rate CHECK ("gstRate" >= 0 AND "gstRate" <= 100);
    END IF;
    
    -- Add price constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'check_price_positive' AND table_name = 'menu_items') THEN
        ALTER TABLE menu_items ADD CONSTRAINT check_price_positive CHECK (price >= 0);
    END IF;
    
    -- Add total amount constraint if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints 
                   WHERE constraint_name = 'check_total_positive' AND table_name = 'orders') THEN
        ALTER TABLE orders ADD CONSTRAINT check_total_positive CHECK ("totalAmount" >= 0);
    END IF;
END $$;

-- Create index on billNumber for better performance
CREATE INDEX IF NOT EXISTS idx_bills_bill_number ON bills("billNumber");

-- Create basic RLS policies for menu_items (most critical)
CREATE POLICY "Users can view menu items" ON menu_items 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id::text = auth.uid()::text 
        AND (
            "businessUnit" = 'all' 
            OR role IN ('super_admin', 'owner')
            OR "businessUnit" = menu_items."businessUnit"
        )
    )
);

-- Create basic RLS policy for tables
CREATE POLICY "Users can view tables" ON tables 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id::text = auth.uid()::text 
        AND (
            "businessUnit" = 'all' 
            OR role IN ('super_admin', 'owner')
            OR "businessUnit" = tables."businessUnit"
        )
    )
);

-- Comments
COMMENT ON CONSTRAINT check_gst_rate ON bills IS 'Ensures GST rate is between 0 and 100 percent';
COMMENT ON CONSTRAINT check_price_positive ON menu_items IS 'Ensures menu item prices are not negative';
COMMENT ON CONSTRAINT check_total_positive ON orders IS 'Ensures order totals are not negative';

-- Success message
SELECT 'Database security fixes applied successfully!' as status;