-- Automatically set the correct sort order for categories
-- This ensures Food, Drinks, Specials appear in the right order

-- Set sort order for main categories
UPDATE categories SET sort_order = 0, updated_at = NOW() WHERE LOWER(TRIM(name)) = 'food' AND parent_id IS NULL;
UPDATE categories SET sort_order = 1, updated_at = NOW() WHERE LOWER(TRIM(name)) = 'drinks' AND parent_id IS NULL;
UPDATE categories SET sort_order = 2, updated_at = NOW() WHERE LOWER(TRIM(name)) = 'specials' AND parent_id IS NULL;

-- Set sort order for Food subcategories (alphabetically)
WITH food_parent AS (
    SELECT id FROM categories WHERE LOWER(TRIM(name)) = 'food' AND parent_id IS NULL LIMIT 1
)
UPDATE categories c
SET sort_order = subquery.row_num, updated_at = NOW()
FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY name) - 1 as row_num
    FROM categories
    WHERE parent_id = (SELECT id FROM food_parent)
) subquery
WHERE c.id = subquery.id;

-- Set sort order for Drinks subcategories (alphabetically)
WITH drinks_parent AS (
    SELECT id FROM categories WHERE LOWER(TRIM(name)) = 'drinks' AND parent_id IS NULL LIMIT 1
)
UPDATE categories c
SET sort_order = subquery.row_num, updated_at = NOW()
FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY name) - 1 as row_num
    FROM categories
    WHERE parent_id = (SELECT id FROM drinks_parent)
) subquery
WHERE c.id = subquery.id;

-- Set sort order for Specials subcategories (alphabetically)
WITH specials_parent AS (
    SELECT id FROM categories WHERE LOWER(TRIM(name)) = 'specials' AND parent_id IS NULL LIMIT 1
)
UPDATE categories c
SET sort_order = subquery.row_num, updated_at = NOW()
FROM (
    SELECT id, ROW_NUMBER() OVER (ORDER BY name) - 1 as row_num
    FROM categories
    WHERE parent_id = (SELECT id FROM specials_parent)
) subquery
WHERE c.id = subquery.id;

-- Verify the results
SELECT 
    CASE WHEN parent_id IS NULL THEN '📁 ' || name ELSE '  └─ ' || name END as category,
    sort_order,
    business_unit
FROM categories
ORDER BY 
    COALESCE(parent_id::text, id::text),
    sort_order;
