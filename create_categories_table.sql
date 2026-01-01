-- Create categories table
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  slug TEXT NOT NULL,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  business_unit TEXT NOT NULL DEFAULT 'all', -- 'restaurant', 'bar', 'hotel', 'garden', 'all'
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Add unique constraint for name within a business unit (or globally if preferred, but usually per parent is best)
  -- For simplicity, let's just ensure name is unique per level/parent per business unit
  UNIQUE(name, parent_id, business_unit)
);

-- Add category_id to menu_items
ALTER TABLE menu_items ADD COLUMN IF NOT EXISTS category_id UUID REFERENCES categories(id) ON DELETE SET NULL;

-- Create an index for faster lookups
CREATE INDEX IF NOT EXISTS idx_categories_parent_id ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_business_unit ON categories(business_unit);
CREATE INDEX IF NOT EXISTS idx_menu_items_category_id ON menu_items(category_id);

-- Start with some default Categories if empty
INSERT INTO categories (name, slug, business_unit, sort_order)
VALUES 
('Food', 'food', 'restaurant', 10),
('Drinks', 'drinks', 'bar', 20),
('Specials', 'specials', 'restaurant', 30)
ON CONFLICT DO NOTHING;
