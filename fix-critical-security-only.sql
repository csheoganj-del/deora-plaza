-- CRITICAL: Minimal security fixes without column assumptions
-- This version only fixes what we know exists and is critical

-- Enable RLS on tables that definitely need it
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;

-- Remove dangerous public policies if they exist
DROP POLICY IF EXISTS "Public read for tracking" ON user_locations;
DROP POLICY IF EXISTS "Public read access" ON user_locations;
DROP POLICY IF EXISTS "Allow public read" ON user_locations;

-- Create basic RLS policy for menu_items (using only columns we know exist)
CREATE POLICY "Authenticated users can view menu items" ON menu_items 
FOR SELECT USING (auth.role() = 'authenticated');

-- Create basic RLS policy for tables
CREATE POLICY "Authenticated users can view tables" ON tables 
FOR SELECT USING (auth.role() = 'authenticated');

-- Create basic RLS policy for categories
CREATE POLICY "Authenticated users can view categories" ON categories 
FOR SELECT USING (auth.role() = 'authenticated');

-- Create index on billNumber for performance (this column definitely exists)
CREATE INDEX IF NOT EXISTS idx_bills_bill_number ON bills("billNumber");

-- Success message
SELECT 'Critical security fixes applied successfully - RLS enabled on key tables' as status;