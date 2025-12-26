-- 1. Insert missing categories from menu_items into the categories table
-- We assume 'all' as business_unit for now, or you could try to be smart with CASE statements if you know the data.
INSERT INTO categories (name, slug, business_unit, sort_order)
SELECT DISTINCT 
    m.category, 
    LOWER(REGEXP_REPLACE(m.category, '[^a-zA-Z0-9]+', '-', 'g')), 
    COALESCE(m."businessUnit", 'all'), -- Corrected column name to businessUnit
    100
FROM menu_items m
WHERE m.category IS NOT NULL 
AND m.category != ''
AND NOT EXISTS (
    SELECT 1 FROM categories c WHERE c.name = m.category
);

-- 2. Update menu_items to link to the new category_ids
UPDATE menu_items
SET category_id = c.id
FROM categories c
WHERE menu_items.category = c.name
AND menu_items.category_id IS NULL;
