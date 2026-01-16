-- ============================================================================
-- Final Menu Database Update Script
-- Purpose: Update menu to match the FINAL provided list exactly.
-- Strategy:
--   1. Create valid list of new items
--   2. Update existing items where names match
--   3. Insert new items
--   4. Delete (or soft delete) items not in the list
-- ============================================================================

BEGIN;

-- 1. Create a temporary table to hold the desired final state
CREATE TEMP TABLE desired_menu (
    category_name TEXT,
    item_name TEXT,
    item_price NUMERIC
);

-- 2. Insert the FINAL list of items
INSERT INTO desired_menu (category_name, item_name, item_price) VALUES
-- BLOOM SPECIAL
('BLOOM SPECIAL', 'Bloom Special Thali', 300),

-- SANDWICH
('SANDWICH', 'Garlic Bread', 179),
('SANDWICH', 'Cheese Garlic Bread', 199),
('SANDWICH', 'Cheese Chilli Garlic Bread', 210),
('SANDWICH', 'Veg Sandwich', 89),
('SANDWICH', 'Veg Cheese Sandwich', 99),
('SANDWICH', 'Veg Grilled Sandwich', 129),
('SANDWICH', 'Veg Cheese Grilled Sandwich', 159), -- Renamed from Veg Cheese Grill Sandwich
('SANDWICH', 'Bread Butter Cheese Sandwich', 59),
('SANDWICH', 'French Fry Peri Peri', 189),
('SANDWICH', 'French Fry Crispy', 199),
('SANDWICH', 'French Fry Salty', 189),
('SANDWICH', 'Bombay Sandwich', 99),
('SANDWICH', 'Paneer Sandwich', 169),

-- TANDOORI STARTER & KABAB
('TANDOORI STARTER & KABAB', 'Paneer Tikka', 269),
('TANDOORI STARTER & KABAB', 'Achari Paneer Tikka', 239),
('TANDOORI STARTER & KABAB', 'Malai Paneer Tikka', 299),
('TANDOORI STARTER & KABAB', 'Mushroom Tikka Dry', 240),
('TANDOORI STARTER & KABAB', 'Stuff Aloo Tikka Dry', 240),
('TANDOORI STARTER & KABAB', 'Hara Bhara Kabab', 199),
('TANDOORI STARTER & KABAB', 'Corn Kabab', 219),
('TANDOORI STARTER & KABAB', 'Tandoori Sizzler', 320),
('TANDOORI STARTER & KABAB', 'Malai Soya Chap', 259),
('TANDOORI STARTER & KABAB', 'Tandoori Soya Chap', 199),
('TANDOORI STARTER & KABAB', 'Achari Soya Chap', 209),
('TANDOORI STARTER & KABAB', 'Soya Chap Dry', 240),
('TANDOORI STARTER & KABAB', 'Crispy Corn', 230),

-- CHINESE STARTER
('CHINESE STARTER', 'Veg Manchurian Dry', 199), -- New split item
('CHINESE STARTER', 'Veg Manchurian Gravy', 199), -- New split item
('CHINESE STARTER', 'Paneer Chilli Dry', 239), -- New split item
('CHINESE STARTER', 'Paneer Chilli Gravy', 239), -- New split item
('CHINESE STARTER', 'Paneer Manchurian', 220),
('CHINESE STARTER', 'Mushroom Chilli Dry', 200),
('CHINESE STARTER', 'Honey Chilli Potato', 170),
('CHINESE STARTER', 'Honey Chilli', 289),
('CHINESE STARTER', 'Veg Crispy', 160),
('CHINESE STARTER', 'Chinese Bhel', 150),

-- NOODLES & MAGGI
('NOODLES & MAGGI', 'Hakka Noodles', 150),
('NOODLES & MAGGI', 'Veg Noodles', 150),
('NOODLES & MAGGI', 'Schezwan Noodles', 179),
('NOODLES & MAGGI', 'Manchurian Noodles', 160),
('NOODLES & MAGGI', 'Spring Roll (2 Pc)', 200),
('NOODLES & MAGGI', 'Veg Maggi', 70),
('NOODLES & MAGGI', 'Butter Maggi', 100), -- Renamed from Maggi Amul Butter? or new
('NOODLES & MAGGI', 'Tandoori Maggi', 100),
('NOODLES & MAGGI', 'Paneer Maggi', 110),
('NOODLES & MAGGI', 'Cheese Maggi', 99),

-- PASTA
('PASTA', 'White Sauce Pasta', 199),
('PASTA', 'Red Sauce Pasta', 189),
('PASTA', 'Mix Sauce Pasta', 199),
('PASTA', 'Tandoori Pasta', 140),
('PASTA', 'Makhani Pasta', 130),

-- BURGER
('BURGER', 'Veg Burger', 59),
('BURGER', 'Veg Cheese Burger', 109),
('BURGER', 'Aloo Tikki Burger', 80),
('BURGER', 'Paneer Burger Spicy', 120),
('BURGER', 'Veg Grilled Burger', 100),
('BURGER', 'Tandoori Burger', 108),

-- PIZZA
('PIZZA', 'Margherita Pizza Small', 179),
('PIZZA', 'Margherita Pizza Big', 210),
('PIZZA', 'Farm House Pizza Small', 209),
('PIZZA', 'Farm House Pizza Big', 279),
('PIZZA', 'Veg Cheese Pizza Small', 179),
('PIZZA', 'Veg Cheese Pizza Big', 229),
('PIZZA', 'Paneer Tikka Pizza Small', 199),
('PIZZA', 'Paneer Tikka Pizza Big', 249),
('PIZZA', 'Italian Pizza', 200),
('PIZZA', 'Mexican Pizza', 210),
('PIZZA', 'Otc Pizza', 175),
('PIZZA', 'Tandoori Paneer Pizza', 220),
('PIZZA', 'Golden Corn Pizza', 200),
('PIZZA', 'Onion Paneer Pizza', 160),
('PIZZA', 'Sweet Corn Pizza', 180),
('PIZZA', 'Tandoori Pizza', 230),
('PIZZA', 'Kakhani Pizza', 240),

-- RICE & BIRYANI
('RICE & BIRYANI', 'Steam Rice', 90),
('RICE & BIRYANI', 'Fried Rice', 179),
('RICE & BIRYANI', 'Jeera Rice', 120),
('RICE & BIRYANI', 'Veg Pulao', 150),
('RICE & BIRYANI', 'Paneer Pulao', 190),
('RICE & BIRYANI', 'Veg Biryani', 180),
('RICE & BIRYANI', 'Veg Cheese Biryani', 210),
('RICE & BIRYANI', 'Veg Hyderabadi Biryani', 180),
('RICE & BIRYANI', 'Veg Handi Biryani', 190),
('RICE & BIRYANI', 'Chinese Fried Rice', 150),
('RICE & BIRYANI', 'Schezwan Fried Rice', 169),
('RICE & BIRYANI', 'Veg Fried Rice', 150),
('RICE & BIRYANI', 'Manchurian Fried Rice', 190),
('RICE & BIRYANI', 'Bloom Special Rice', 210),

-- SOUP
('SOUP', 'Tomato Soup', 129),
('SOUP', 'Manchow Soup', 109),
('SOUP', 'Hot & Sour Soup', 119),
('SOUP', 'Sweet Corn Soup', 99),
('SOUP', 'Veg Soup', 140),
('SOUP', 'Lemon Coriander Soup', 130),

-- SPECIAL VEG
('SPECIAL VEG', 'Dum Aloo', 180),
('SPECIAL VEG', 'Bhindi Pyaz', 140),
('SPECIAL VEG', 'Bhindi Fry', 150),
('SPECIAL VEG', 'Bhindi Masala', 150),
('SPECIAL VEG', 'Mix Veg', 140),
('SPECIAL VEG', 'Veg Patiyala', 190),
('SPECIAL VEG', 'Veg Handi', 190),
('SPECIAL VEG', 'Veg Makhan Wala', 200),

-- PARATHA
('PARATHA', 'Plain Paratha', 49),
('PARATHA', 'Butter Paratha', 59),
('PARATHA', 'Aloo Paratha', 79),
('PARATHA', 'Pyaaz Paratha', 79),
('PARATHA', 'Paneer Paratha', 99),
('PARATHA', 'Gobhi Paratha', 79),
('PARATHA', 'Mix Paratha', 99),
('PARATHA', 'Lachha Paratha', 65),

-- NAAN / ROTI
('NAAN / ROTI', 'Naan Plain', 45),
('NAAN / ROTI', 'Naan Butter', 55),
('NAAN / ROTI', 'Garlic Naan', 75),
('NAAN / ROTI', 'Cheese Garlic Naan', 80),
('NAAN / ROTI', 'Cheese Butter Naan', 75),
('NAAN / ROTI', 'Butter Kulcha', 65),
('NAAN / ROTI', 'Tandoori Roti', 20),
('NAAN / ROTI', 'Tandoori Butter Roti', 22),
('NAAN / ROTI', 'Missi Roti', 60),

-- DESSERTS
('DESSERTS', 'Raj Bhog Ice Cream', 50),
('DESSERTS', 'American Nuts Ice Cream', 60),
('DESSERTS', 'Butter Scotch Ice Cream', 59),
('DESSERTS', 'Chocolate Ice Cream', 69),
('DESSERTS', 'Vanilla Ice Cream', 49),
('DESSERTS', 'Sweet (2 Pc)', 30),

-- HOT & COLD BEVERAGE
('HOT & COLD BEVERAGE', 'Hot Coffee', 59),
('HOT & COLD BEVERAGE', 'Cold Coffee', 149),
('HOT & COLD BEVERAGE', 'Cold Coffee with Ice Cream', 189),
('HOT & COLD BEVERAGE', 'Hot Chocolate', 70),
('HOT & COLD BEVERAGE', 'Masala Tea', 49),
('HOT & COLD BEVERAGE', 'Black Tea', 39),
('HOT & COLD BEVERAGE', 'Cookie Tea', 30),
('HOT & COLD BEVERAGE', 'Mineral Water', 10),

-- MILKSHAKE & JUICE
('MILKSHAKE & JUICE', 'Oreo Shake', 169),
('MILKSHAKE & JUICE', 'KitKat Shake', 179),
('MILKSHAKE & JUICE', 'Chocolate Shake', 159),
('MILKSHAKE & JUICE', 'Strawberry Shake', 130),
('MILKSHAKE & JUICE', 'Pineapple Shake', 130),
('MILKSHAKE & JUICE', 'Orange Juice', 120),
('MILKSHAKE & JUICE', 'Pineapple Juice', 110),
('MILKSHAKE & JUICE', 'Apple Juice', 130),
('MILKSHAKE & JUICE', 'Mixed Fruit Juice', 140),
('MILKSHAKE & JUICE', 'Butter Scotch Shake', 169),
('MILKSHAKE & JUICE', 'Butter Milk', 25),
('MILKSHAKE & JUICE', 'Lassi', 50),

-- MOCKTAIL
('MOCKTAIL', 'Mint Mojito', 140),
('MOCKTAIL', 'Blue Lagoon', 149),
('MOCKTAIL', 'Watermelon Mojito', 140),
('MOCKTAIL', 'Pulse Mint Mojito', 140),
('MOCKTAIL', 'Sunny Setup', 160),
('MOCKTAIL', 'Punch Mel', 179),
('MOCKTAIL', 'Fresh Lemon Soda', 99),
('MOCKTAIL', 'Virgin Mojito', 139);


-- 3. Update existing items to match the desired state
--    This preserves IDs for items that already exist
UPDATE menu_items 
SET 
  price = dm.item_price, 
  category = dm.category_name,
  "isAvailable" = true,
  "businessUnit" = 'cafe'
FROM desired_menu dm
WHERE LOWER(TRIM(menu_items.name)) = LOWER(TRIM(dm.item_name));

-- 4. Insert new items that don't exist yet
INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT dm.item_name, dm.category_name, dm.item_price, true, 'cafe'
FROM desired_menu dm
WHERE NOT EXISTS (
    SELECT 1 FROM menu_items mi 
    WHERE LOWER(TRIM(mi.name)) = LOWER(TRIM(dm.item_name))
);

-- 5. Delete items that are NOT in the desired list
--    Note: This deletes any item in the database (for 'cafe' unit presumably? Or valid menu table items?)
--    Safety: Only delete if it's not in our 'desired_menu' table.
DELETE FROM menu_items
WHERE LOWER(TRIM(name)) NOT IN (
    SELECT LOWER(TRIM(item_name)) FROM desired_menu
);
-- Note: If you have multi-tenant/multiple business units sharing this table, 
-- you might want to restrict the DELETE to just 'cafe' items or similar if there's a risk of deleting other units' items. 
-- However, based on the context, this seems to be a single-unit menu or the main menu.
-- Uncommment the following line if you only want to affect 'cafe' items:
-- AND "businessUnit" = 'cafe';

-- Drop temp table
DROP TABLE desired_menu;

-- ============================================================================
-- Verification
-- ============================================================================

SELECT 'Post-Update Category Counts:' as info;
SELECT category, COUNT(*) as count 
FROM menu_items 
GROUP BY category 
ORDER BY category;

SELECT 'Total Items:' as info;
SELECT COUNT(*) as total_items FROM menu_items;

COMMIT;

SELECT '✅ Final Menu Update Completed Successfully!' as status;
