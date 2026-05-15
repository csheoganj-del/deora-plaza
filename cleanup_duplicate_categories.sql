-- Clean up duplicate 'Food', 'Drinks', 'Specials' categories
-- Strategy: Keep the one created by our 'organize' script (likely the one with specific business_unit) or just the first one found, and move everything to it.

DO $$
DECLARE
    target_id UUID;
    dup_id UUID;
    cat_name TEXT;
    names TEXT[] := ARRAY['Food', 'Drinks', 'Specials'];
BEGIN
    FOREACH cat_name IN ARRAY names
    LOOP
        -- 1. Find the "primary" category (prefer the one with the correct business unit if possible, or just the oldest)
        SELECT id INTO target_id 
        FROM categories 
        WHERE name = cat_name 
        ORDER BY created_at ASC 
        LIMIT 1;

        IF target_id IS NOT NULL THEN
            -- 2. Find duplicates
            FOR dup_id IN 
                SELECT id FROM categories 
                WHERE name = cat_name AND id != target_id
            LOOP
                -- Move Items
                UPDATE menu_items SET category_id = target_id WHERE category_id = dup_id;
                
                -- Move Children Categories
                UPDATE categories SET parent_id = target_id WHERE parent_id = dup_id;
                
                -- Delete Duplicate
                DELETE FROM categories WHERE id = dup_id;
            END LOOP;
        END IF;
    END LOOP;
END $$;

-- Verify 3 Main Categories exist and are clean
INSERT INTO categories (name, slug, business_unit, sort_order)
VALUES 
('Food', 'food', 'restaurant', 10),
('Drinks', 'drinks', 'bar', 20),
('Specials', 'specials', 'restaurant', 30)
ON CONFLICT (name, parent_id, business_unit) DO NOTHING;
