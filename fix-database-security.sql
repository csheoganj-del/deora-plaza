-- CRITICAL: Fix database security issues
-- Enable RLS on all tables and fix overly permissive policies

-- Enable RLS on missing tables
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE counters ENABLE ROW LEVEL SECURITY;

-- Remove dangerous public read policy
DROP POLICY IF EXISTS "Public read for tracking" ON user_locations;

-- Create secure policies for menu_items
CREATE POLICY "Users can view menu items in their business unit" ON menu_items 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id::text = auth.uid()::text 
        AND ("businessUnit" = menu_items."businessUnit" OR "businessUnit" = 'all' OR role IN ('super_admin', 'owner'))
    )
);

CREATE POLICY "Managers can manage menu items in their business unit" ON menu_items 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id::text = auth.uid()::text 
        AND (
            ("businessUnit" = menu_items."businessUnit" AND role IN ('manager', 'cafe_manager', 'bar_manager')) 
            OR "businessUnit" = 'all' 
            OR role IN ('super_admin', 'owner')
        )
    )
);

-- Create secure policies for categories
CREATE POLICY "Users can view categories in their business unit" ON categories 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id::text = auth.uid()::text 
        AND ("businessUnit" = categories."businessUnit" OR "businessUnit" = 'all' OR role IN ('super_admin', 'owner'))
    )
);

-- Create secure policies for tables
CREATE POLICY "Users can view tables in their business unit" ON tables 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id::text = auth.uid()::text 
        AND ("businessUnit" = tables."businessUnit" OR "businessUnit" = 'all' OR role IN ('super_admin', 'owner'))
    )
);

-- Create secure policies for counters
CREATE POLICY "Only super admins can access counters" ON counters 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id::text = auth.uid()::text 
        AND role IN ('super_admin', 'owner')
    )
);

-- Fix user_locations policy to be more secure
CREATE POLICY "Users can view locations in their business unit" ON user_locations 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM users 
        WHERE id::text = auth.uid()::text 
        AND (
            user_id = auth.uid()::text 
            OR "businessUnit" = 'all' 
            OR role IN ('super_admin', 'owner', 'manager')
        )
    )
);

-- Add constraints for data integrity
ALTER TABLE bills ADD CONSTRAINT check_gst_rate CHECK ("gstRate" >= 0 AND "gstRate" <= 100);
ALTER TABLE menu_items ADD CONSTRAINT check_price_positive CHECK (price >= 0);
ALTER TABLE orders ADD CONSTRAINT check_total_positive CHECK ("totalAmount" >= 0);

-- Create unique constraint on bill numbers per date
CREATE UNIQUE INDEX IF NOT EXISTS idx_bills_unique_number_date 
ON bills (DATE("createdAt"), "billNumber");

-- Add foreign key constraints (using camelCase column names)
ALTER TABLE order_items 
ADD CONSTRAINT fk_order_items_menu_item 
FOREIGN KEY ("menuItemId") REFERENCES menu_items(id) ON DELETE RESTRICT;

ALTER TABLE order_items 
ADD CONSTRAINT fk_order_items_order 
FOREIGN KEY ("orderId") REFERENCES orders(id) ON DELETE CASCADE;

-- Add audit trigger for price changes
CREATE OR REPLACE FUNCTION audit_price_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.price != NEW.price THEN
        INSERT INTO audit_logs (table_name, record_id, action, old_values, new_values, user_id, timestamp)
        VALUES (
            'menu_items',
            NEW.id,
            'price_change',
            json_build_object('price', OLD.price),
            json_build_object('price', NEW.price),
            auth.uid(),
            NOW()
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_audit_menu_price_changes
    AFTER UPDATE ON menu_items
    FOR EACH ROW
    EXECUTE FUNCTION audit_price_changes();

-- Comment
COMMENT ON CONSTRAINT check_gst_rate ON bills IS 'Ensures GST rate is between 0 and 100 percent';
COMMENT ON CONSTRAINT check_price_positive ON menu_items IS 'Ensures menu item prices are not negative';
COMMENT ON CONSTRAINT check_total_positive ON orders IS 'Ensures order totals are not negative';