-- ============================================================================
-- Menu Database Update Script
-- Purpose: Update menu to match provided menu exactly
-- Actions: 
--   1. Fix 2 price discrepancies
--   2. Add missing menu items
--   3. Remove extra items not in provided menu
--   4. Fix category assignments
-- ============================================================================

BEGIN;

-- ============================================================================
-- STEP 1: FIX PRICE DISCREPANCIES
-- ============================================================================

-- Fix Veg Cheese Grill Sandwich: ₹129 → ₹159
UPDATE menu_items 
SET price = 159 
WHERE UPPER(TRIM(name)) LIKE '%VEG CHEESE GRILL SANDWICH%';

-- Fix Lachha Paratha: ₹55 → ₹65
UPDATE menu_items 
SET price = 65 
WHERE UPPER(TRIM(name)) LIKE '%LACHHA PARATHA%';

-- ============================================================================
-- STEP 2: FIX CATEGORY ASSIGNMENTS
-- ============================================================================

-- Fix PARATHA category (currently in DESERT or CHINESE)
UPDATE menu_items 
SET category = 'PARATHA' 
WHERE UPPER(TRIM(name)) IN (
  'PLAIN PARATHA', 'BUTTER PARATHA', 'ALOO PARATHA', 
  'PYAAZ PARATHA', 'PANEER PARATHA', 'GOBHI PARATHA', 
  'MIX PARATHA', 'LACHHA PARATHA'
);

-- Fix NAAN/ROTI category
UPDATE menu_items 
SET category = 'NAAN / ROTI' 
WHERE UPPER(TRIM(name)) IN (
  'NAAN PLAIN', 'NAAN BUTTER', 'CHEESE BUTTER NAAN', 'CHEESE BUTTER NANN',
  'GARLIC NAAN', 'CHEESE GARLIC NAAN', 'BUTTER KULCHA',
  'TANDOORI ROTI', 'TANDOORI BUTTER ROTI', 'MISSI ROTI', 'MISSI ROTI (BUTTER)',
  'TANDOORI PLAIN', 'TANDOORI (BUTTER)', 'CHAPATI PLAIN', 'CHAPATI BUTTER'
);

-- Fix SPECIAL VEG category
UPDATE menu_items 
SET category = 'SPECIAL VEG' 
WHERE UPPER(TRIM(name)) IN (
  'DUM ALOO', 'BHINDI PYAAZ', 'BHINDI FRY', 'BHINDI MASALA', 'BHINDI (FRY)',
  'SP. (HALDI) ( WINTER)', 'SPL. HALDI (WINTER)', 'MIX VEG', 'MIX VEG.', 
  'VEG PATIYALA', 'VEG HANDI', 'VEG MAKHAN WALA'
);

-- Fix DESSERTS category
UPDATE menu_items 
SET category = 'DESSERTS' 
WHERE UPPER(TRIM(name)) IN (
  'RAJ BHOG ICE CREAM', 'AMERICAN NUTS ICE CREAM', 
  'BUTTER SCOTCH ICE CREAM', 'CHOCOLATE ICE CREAM',
  'SWEET (2 PC)', 'VANILLA ICE CREAM', 'ROSPEREL ICE CREAM'
);

-- Fix SOUP category
UPDATE menu_items 
SET category = 'SOUP' 
WHERE UPPER(TRIM(name)) IN (
  'TOMATO SOUP', 'MANCHOW SOUP', 'HOT & SOUR SOUP', 'HOT AND SOUR SOUP',
  'SWEET CORN SOUP', 'VEG SOUP', 'LEMON CORIANDER SOUP'
);

-- Fix BURGER category
UPDATE menu_items 
SET category = 'BURGER' 
WHERE UPPER(TRIM(name)) IN (
  'VEG BURGER', 'TANDOORI BURGER', 'VEG CHEESE BURGER',
  'PANEER BURGER SPICY', 'ALOO TIKKI BURGER', 'VEG GRILLED BURGER'
);

-- Fix SANDWICH category
UPDATE menu_items 
SET category = 'SANDWICH' 
WHERE UPPER(TRIM(name)) IN (
  'GARLIC BREAD', 'CHEESE GARLIC BREAD', 'CHEESE CHILLI GARLIC BREAD',
  'VEG SANDWICH & FRENCH FRY', 'VEG CHEESE SANDWICH', 'VEG GRILLED SANDWICH',
  'VEG CHEESE GRILL SANDWICH', 'BREAD BUTTER CHEESE SANDWICH',
  'EXTRA CHEESE ADDED', 'FRENCH FRY PERI PERI', 'FRENCH FRY CRISPY',
  'FRENCH FRY SALTY', 'BOMBAY SANDWICH', 'PANEER SANDWICH',
  'CHEESE CHILLI SANDWICH'
);

-- Fix TANDOORI category
UPDATE menu_items 
SET category = 'TANDOOR' 
WHERE UPPER(TRIM(name)) IN (
  'PANEER TIKKA', 'ACHARI PANEER TIKKA', 'MALAI PANEER TIKKA',
  'MUSHROOM TIKKA DRY', 'STUFF ALOO TIKKA DRY', 'HARA BHARA KABAB',
  'CORN KABAB', 'TANDOORI SIZZLER', 'MALAI SOYA CHAP',
  'TANDOORI SOYA CHAP', 'ACHARI SOYA CHAP', 'SOYA CHAP (DRY)', 'SOYA CHAP DRY',
  'CRISPY CORN'
);

-- Fix CHINESE category
UPDATE menu_items 
SET category = 'CHINESE' 
WHERE UPPER(TRIM(name)) IN (
  'MANCHURIAN (DRY/GRAVY)', 'MANCHURIAN DRY', 'MANCHURIAN GRAVY', 'GOBHI MANCHURIAN',
  'VEG CHEESE CHOWMEIN', 'PANEER CHILLI DRY/GRAVY', 'PANEER CHILLI DRY', 'PANEER CHILLI GRAVY',
  'PANEER MANCHURIAN', 'MUSHROOM CHILLI DRY', 'MUSHROOM CHILLI (DRY)',
  'HONEY CHILLI POTATO', 'HONEY CHILLI', 'HONEY CHILLI GOBHI',
  'VEG CRISPY', 'CHINESE BHEL', 'HAKKA NOODLES', 'NOODLES',
  'SCHEZWAN NOODLES', 'VEG NOODLES', 'SPRING ROLL (2 PC)', 'SPRING ROLL (2 PIC)',
  'MAGGI AMUL BUTTER', 'MANCHURIAN NOODLES', 'MUSHROOM SALT & PEPPER FRY',
  'MUSHROOM SALT &PEPPER FRY', 'VEG MAGGI', 'TANDOORI MAGGI',
  'PANEER MAGGI', 'CHEESE MAGGI', 'CHILLI MUSHROOM', 'CHILLI POTATO',
  'CHEESE MANCHURIAN'
);

-- Fix PASTA category
UPDATE menu_items 
SET category = 'PASTA' 
WHERE UPPER(TRIM(name)) IN (
  'WHITE SAUCE PASTA', 'RED SAUCE PASTA', 'TANDOORI PASTA',
  'MAKHANI PASTA', 'MIX SAUCE PASTA'
);

-- Fix PIZZA category
UPDATE menu_items 
SET category = 'PIZZA' 
WHERE UPPER(TRIM(name)) IN (
  'MARGHERITA PIZZA (BIG)', 'MARGHERITA PIZZA (SMALL)', 'MARGRET PIZZA- BIG',
  'DOUBLE CHEESE', 'TOMATO PIZZA', 'FARM HOUSE PIZZA (BIG)', 'FARM HOUSE PIZZA (SMALL)',
  'JAIN PIZZA', 'VEG CHEESE PIZZA (BIG)', 'VEG CHEESE PIZZA (SMALL)', 'VEG CHEESE PIZZA ( SMALL)',
  'ITALIAN PIZZA', 'ITALIAN PIZZA ( SMALL)', 'MEXICAN PIZZA', 'OTC PIZZA',
  'TANDOORI PANEER PIZZA', 'GOLDEN CORN PIZZA', 'ONION PANEER PIZZA',
  'SWEET CORN PIZZA', 'SWEET CORN PIZZZA (SMALL)', 'PANEER TIKKA PIZZA (BIG)', 
  'PANEER TIKKA PIZZA (SMALL)', 'TANDOORI PIZZA', 'KAKHANI PIZZA'
);

-- Fix RICE category
UPDATE menu_items 
SET category = 'RICE' 
WHERE UPPER(TRIM(name)) IN (
  'STEAM RICE', 'FRIED RICE', 'JEERA RICE', 'VEG PULAO',
  'PANEER PULAO', 'VEG BIRYANI', 'VEG CHEESE BIRYANI',
  'VEG HYDERABADI BIRYANI', 'VEG HANDI BIRYANI', 'CHINESE FRIED RICE',
  'SCHEZWAN FRIED RICE', 'SCHEZWAN RICE', 'VEG FRIED RICE', 'MANCHURIAN FRIED RICE',
  'BLOOM SPECIAL RICE', 'NOODLES FRIED RICE', 'MUSHROOM FRIED RICE', 'PANEER FRIED RICE'
);

-- Fix HOT & COLD BEVERAGE category
UPDATE menu_items 
SET category = 'HOT & COLD BEVERAGE' 
WHERE UPPER(TRIM(name)) IN (
  'COLD COFFEE', 'COLD COFFEE WITH ICE CREAM', 'HOT COFFEE',
  'HOT CHOCOLATE', 'MINERAL WATER', 'WATER BOTTLE 250 ML',
  'COOKIE TEA', 'MASALA TEA', 'BLACK TEA'
);

-- Fix MILKSHAKE & JUICE category
UPDATE menu_items 
SET category = 'MILKSHAKE & JUICE' 
WHERE UPPER(TRIM(name)) IN (
  'OREO SHAKE', 'KITKAT SHAKE', 'KIT KAT SHAKE', 'CHOCOLATE SHAKE',
  'STRAWBERRY SHAKE', 'PINEAPPLE SHAKE', 'ORANGE JUICE',
  'PINEAPPLE JUICE', 'APPLE JUICE', 'MIXED FRUIT JUICE',
  'BUTTER SCOTCH SHAKE', 'LASSI'
);

-- Fix MOCKTAIL category
UPDATE menu_items 
SET category = 'MOCKTAIL' 
WHERE UPPER(TRIM(name)) IN (
  'MINT MOJITO', 'BLUE LAGOON', 'WATERMELON MOJITO',
  'PULSE MINT MOJITO', 'SUNNY SETUP', 'PUNCH MEL', 'PANCH MEL',
  'FRESH LEMON SODA', 'VIRGIN MOJITO', 'BUTTER MILK'
);

-- ============================================================================
-- STEP 3: ADD MISSING MENU ITEMS
-- ============================================================================

-- Insert missing items (only if they don't already exist)

-- SANDWICH items
INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Veg Sandwich & French Fry', 'SANDWICH', 89, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'VEG SANDWICH & FRENCH FRY');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Veg Grilled Sandwich', 'SANDWICH', 129, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'VEG GRILLED SANDWICH');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Bread Butter Cheese Sandwich', 'SANDWICH', 59, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'BREAD BUTTER CHEESE SANDWICH');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'French Fry Peri Peri', 'SANDWICH', 189, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'FRENCH FRY PERI PERI');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Bombay Sandwich', 'SANDWICH', 99, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'BOMBAY SANDWICH');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Cheese Chilli Garlic Bread', 'SANDWICH', 210, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'CHEESE CHILLI GARLIC BREAD');

-- TANDOORI items
INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Achari Paneer Tikka', 'TANDOOR', 239, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'ACHARI PANEER TIKKA');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Hara Bhara Kabab', 'TANDOOR', 199, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'HARA BHARA KABAB');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Malai Soya Chap', 'TANDOOR', 259, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'MALAI SOYA CHAP');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Tandoori Soya Chap', 'TANDOOR', 199, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'TANDOORI SOYA CHAP');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Achari Soya Chap', 'TANDOOR', 209, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'ACHARI SOYA CHAP');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Crispy Corn', 'TANDOOR', 230, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'CRISPY CORN');

-- CHINESE items
INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Manchurian (Dry/Gravy)', 'CHINESE', 199, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) LIKE '%MANCHURIAN%' AND category = 'CHINESE' AND price = 199);

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Paneer Chilli Dry/Gravy', 'CHINESE', 239, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) LIKE '%PANEER CHILLI%' AND price = 239);

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Honey Chilli', 'CHINESE', 289, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'HONEY CHILLI');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Hakka Noodles', 'CHINESE', 150, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'HAKKA NOODLES');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Chilli Mushroom', 'CHINESE', 239, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'CHILLI MUSHROOM');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Chilli Potato', 'CHINESE', 199, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'CHILLI POTATO');

-- PASTA items
INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Red Sauce Pasta', 'PASTA', 189, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'RED SAUCE PASTA');

-- BURGER items
INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Veg Burger', 'BURGER', 59, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'VEG BURGER');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Veg Cheese Burger', 'BURGER', 109, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'VEG CHEESE BURGER');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Paneer Burger Spicy', 'BURGER', 120, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'PANEER BURGER SPICY');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Aloo Tikki Burger', 'BURGER', 80, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'ALOO TIKKI BURGER');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Veg Grilled Burger', 'BURGER', 100, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'VEG GRILLED BURGER');

-- PIZZA items
INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Margherita Pizza (Big)', 'PIZZA', 210, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) LIKE '%MARGHERITA%BIG%');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Margherita Pizza (Small)', 'PIZZA', 179, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) LIKE '%MARGHERITA%SMALL%');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Double Cheese', 'PIZZA', 190, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'DOUBLE CHEESE');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Farm House Pizza (Big)', 'PIZZA', 279, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) LIKE '%FARM HOUSE%BIG%');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Farm House Pizza (Small)', 'PIZZA', 209, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) LIKE '%FARM HOUSE%SMALL%');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Mexican Pizza', 'PIZZA', 210, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'MEXICAN PIZZA');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'OTC Pizza', 'PIZZA', 175, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'OTC PIZZA');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Tandoori Paneer Pizza', 'PIZZA', 220, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'TANDOORI PANEER PIZZA');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Golden Corn Pizza', 'PIZZA', 200, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'GOLDEN CORN PIZZA');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Onion Paneer Pizza', 'PIZZA', 160, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'ONION PANEER PIZZA');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Paneer Tikka Pizza (Big)', 'PIZZA', 249, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) LIKE '%PANEER TIKKA PIZZA%BIG%');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Paneer Tikka Pizza (Small)', 'PIZZA', 199, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) LIKE '%PANEER TIKKA PIZZA%SMALL%');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Tandoori Pizza', 'PIZZA', 230, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'TANDOORI PIZZA');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Kakhani Pizza', 'PIZZA', 240, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'KAKHANI PIZZA');

-- RICE items
INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Steam Rice', 'RICE', 90, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'STEAM RICE');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Jeera Rice', 'RICE', 120, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'JEERA RICE');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Veg Pulao', 'RICE', 150, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'VEG PULAO');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Paneer Pulao', 'RICE', 190, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'PANEER PULAO');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Veg Biryani', 'RICE', 180, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'VEG BIRYANI');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Veg Cheese Biryani', 'RICE', 210, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'VEG CHEESE BIRYANI');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Veg Hyderabadi Biryani', 'RICE', 180, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'VEG HYDERABADI BIRYANI');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Veg Handi Biryani', 'RICE', 190, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'VEG HANDI BIRYANI');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Chinese Fried Rice', 'RICE', 150, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'CHINESE FRIED RICE');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Veg Fried Rice', 'RICE', 150, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'VEG FRIED RICE');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Manchurian Fried Rice', 'RICE', 190, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'MANCHURIAN FRIED RICE');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Bloom Special Rice', 'RICE', 210, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'BLOOM SPECIAL RICE');

-- SOUP items
INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Sweet Corn Soup', 'SOUP', 99, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'SWEET CORN SOUP');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Veg Soup', 'SOUP', 140, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'VEG SOUP');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Lemon Coriander Soup', 'SOUP', 130, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'LEMON CORIANDER SOUP');

-- DESSERTS items
INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Raj Bhog Ice Cream', 'DESSERTS', 50, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'RAJ BHOG ICE CREAM');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'American Nuts Ice Cream', 'DESSERTS', 60, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'AMERICAN NUTS ICE CREAM');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Butter Scotch Ice Cream', 'DESSERTS', 59, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'BUTTER SCOTCH ICE CREAM');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Chocolate Ice Cream', 'DESSERTS', 69, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'CHOCOLATE ICE CREAM');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Sweet (2 Pc)', 'DESSERTS', 30, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'SWEET (2 PC)');

-- HOT & COLD BEVERAGE items
INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Cold Coffee', 'HOT & COLD BEVERAGE', 149, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'COLD COFFEE' AND price = 149);

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Cold Coffee with Ice Cream', 'HOT & COLD BEVERAGE', 189, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'COLD COFFEE WITH ICE CREAM');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Hot Coffee', 'HOT & COLD BEVERAGE', 59, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'HOT COFFEE');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Hot Chocolate', 'HOT & COLD BEVERAGE', 70, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'HOT CHOCOLATE');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Mineral Water', 'HOT & COLD BEVERAGE', 10, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'MINERAL WATER');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Cookie Tea', 'HOT & COLD BEVERAGE', 30, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'COOKIE TEA');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Masala Tea', 'HOT & COLD BEVERAGE', 49, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'MASALA TEA');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Black Tea', 'HOT & COLD BEVERAGE', 39, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'BLACK TEA');

-- MILKSHAKE & JUICE items
INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Chocolate Shake', 'MILKSHAKE & JUICE', 159, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'CHOCOLATE SHAKE');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Strawberry Shake', 'MILKSHAKE & JUICE', 130, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'STRAWBERRY SHAKE');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Pineapple Shake', 'MILKSHAKE & JUICE', 130, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'PINEAPPLE SHAKE');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Orange Juice', 'MILKSHAKE & JUICE', 120, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'ORANGE JUICE');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Pineapple Juice', 'MILKSHAKE & JUICE', 110, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'PINEAPPLE JUICE');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Apple Juice', 'MILKSHAKE & JUICE', 130, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'APPLE JUICE');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Mixed Fruit Juice', 'MILKSHAKE & JUICE', 140, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'MIXED FRUIT JUICE');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Butter Scotch Shake', 'MILKSHAKE & JUICE', 169, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'BUTTER SCOTCH SHAKE');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Lassi', 'MILKSHAKE & JUICE', 50, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'LASSI');

-- MOCKTAIL items
INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Mint Mojito', 'MOCKTAIL', 140, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'MINT MOJITO');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Blue Lagoon', 'MOCKTAIL', 149, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'BLUE LAGOON');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Sunny Setup', 'MOCKTAIL', 160, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'SUNNY SETUP');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Punch Mel', 'MOCKTAIL', 179, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'PUNCH MEL');

-- NAAN / ROTI items
INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Tandoori Roti', 'NAAN / ROTI', 20, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'TANDOORI ROTI');

INSERT INTO menu_items (name, category, price, "isAvailable", "businessUnit")
SELECT 'Tandoori Butter Roti', 'NAAN / ROTI', 22, true, 'cafe'
WHERE NOT EXISTS (SELECT 1 FROM menu_items WHERE UPPER(TRIM(name)) = 'TANDOORI BUTTER ROTI');

-- ============================================================================
-- STEP 4: DELETE EXTRA ITEMS NOT IN PROVIDED MENU
-- ============================================================================

-- Create a temporary table with all valid menu item names from the provided menu
CREATE TEMP TABLE valid_menu_items (item_name TEXT);

INSERT INTO valid_menu_items (item_name) VALUES
-- SANDWICH
('GARLIC BREAD'), ('CHEESE GARLIC BREAD'), ('CHEESE CHILLI GARLIC BREAD'),
('VEG SANDWICH & FRENCH FRY'), ('VEG CHEESE SANDWICH'), ('VEG GRILLED SANDWICH'),
('VEG CHEESE GRILL SANDWICH'), ('BREAD BUTTER CHEESE SANDWICH'),
('EXTRA CHEESE ADDED'), ('FRENCH FRY PERI PERI'), ('FRENCH FRY CRISPY'),
('FRENCH FRY SALTY'), ('BOMBAY SANDWICH'), ('PANEER SANDWICH'),
-- TANDOOR
('PANEER TIKKA'), ('ACHARI PANEER TIKKA'), ('MALAI PANEER TIKKA'),
('MUSHROOM TIKKA DRY'), ('STUFF ALOO TIKKA DRY'), ('HARA BHARA KABAB'),
('CORN KABAB'), ('TANDOORI SIZZLER'), ('MALAI SOYA CHAP'),
('TANDOORI SOYA CHAP'), ('ACHARI SOYA CHAP'), ('SOYA CHAP (DRY)'), ('SOYA CHAP DRY'),
('CRISPY CORN'),
-- CHINESE
('MANCHURIAN (DRY/GRAVY)'), ('VEG CHEESE CHOWMEIN'), ('PANEER CHILLI DRY/GRAVY'),
('PANEER MANCHURIAN'), ('MUSHROOM CHILLI DRY'), ('MUSHROOM CHILLI (DRY)'),
('HONEY CHILLI POTATO'), ('HONEY CHILLI'), ('VEG CRISPY'), ('CHINESE BHEL'),
('HAKKA NOODLES'), ('NOODLES'), ('SCHEZWAN NOODLES'), ('VEG NOODLES'),
('SPRING ROLL (2 PC)'), ('SPRING ROLL (2 PIC)'), ('MAGGI AMUL BUTTER'),
('MANCHURIAN NOODLES'), ('MUSHROOM SALT & PEPPER FRY'), ('MUSHROOM SALT &PEPPER FRY'),
('VEG MAGGI'), ('TANDOORI MAGGI'), ('PANEER MAGGI'), ('CHEESE MAGGI'),
('CHILLI MUSHROOM'), ('CHILLI POTATO'),
-- PASTA
('WHITE SAUCE PASTA'), ('RED SAUCE PASTA'), ('TANDOORI PASTA'),
('MAKHANI PASTA'), ('MIX SAUCE PASTA'),
-- BURGER
('VEG BURGER'), ('TANDOORI BURGER'), ('VEG CHEESE BURGER'),
('PANEER BURGER SPICY'), ('ALOO TIKKI BURGER'), ('VEG GRILLED BURGER'),
-- PIZZA
('MARGHERITA PIZZA (BIG)'), ('MARGHERITA PIZZA (SMALL)'), ('DOUBLE CHEESE'),
('TOMATO PIZZA'), ('FARM HOUSE PIZZA (BIG)'), ('FARM HOUSE PIZZA (SMALL)'),
('JAIN PIZZA'), ('VEG CHEESE PIZZA (BIG)'), ('VEG CHEESE PIZZA (SMALL)'),
('VEG CHEESE PIZZA ( SMALL)'), ('ITALIAN PIZZA'), ('ITALIAN PIZZA ( SMALL)'),
('MEXICAN PIZZA'), ('OTC PIZZA'), ('TANDOORI PANEER PIZZA'), ('GOLDEN CORN PIZZA'),
('ONION PANEER PIZZA'), ('SWEET CORN PIZZA'), ('SWEET CORN PIZZZA (SMALL)'),
('PANEER TIKKA PIZZA (BIG)'), ('PANEER TIKKA PIZZA (SMALL)'),
('TANDOORI PIZZA'), ('KAKHANI PIZZA'),
-- RICE
('STEAM RICE'), ('FRIED RICE'), ('JEERA RICE'), ('VEG PULAO'),
('PANEER PULAO'), ('VEG BIRYANI'), ('VEG CHEESE BIRYANI'),
('VEG HYDERABADI BIRYANI'), ('VEG HANDI BIRYANI'), ('CHINESE FRIED RICE'),
('SCHEZWAN FRIED RICE'), ('SCHEZWAN RICE'), ('VEG FRIED RICE'),
('MANCHURIAN FRIED RICE'), ('BLOOM SPECIAL RICE'),
-- SOUP
('TOMATO SOUP'), ('MANCHOW SOUP'), ('HOT & SOUR SOUP'), ('HOT AND SOUR SOUP'),
('SWEET CORN SOUP'), ('VEG SOUP'), ('LEMON CORIANDER SOUP'),
-- SPECIAL VEG
('DUM ALOO'), ('BHINDI PYAAZ'), ('BHINDI FRY'), ('BHINDI MASALA'), ('BHINDI (FRY)'),
('SP. (HALDI) ( WINTER)'), ('SPL. HALDI (WINTER)'), ('MIX VEG'), ('MIX VEG.'),
('VEG PATIYALA'), ('VEG HANDI'), ('VEG MAKHAN WALA'),
-- PARATHA
('PLAIN PARATHA'), ('BUTTER PARATHA'), ('ALOO PARATHA'),
('PYAAZ PARATHA'), ('PANEER PARATHA'), ('GOBHI PARATHA'),
('MIX PARATHA'), ('LACHHA PARATHA'),
-- DESSERTS
('RAJ BHOG ICE CREAM'), ('AMERICAN NUTS ICE CREAM'),
('BUTTER SCOTCH ICE CREAM'), ('CHOCOLATE ICE CREAM'),
('SWEET (2 PC)'), ('VANILLA ICE CREAM'),
-- HOT & COLD BEVERAGE
('COLD COFFEE'), ('COLD COFFEE WITH ICE CREAM'), ('HOT COFFEE'),
('HOT CHOCOLATE'), ('MINERAL WATER'), ('COOKIE TEA'),
('MASALA TEA'), ('BLACK TEA'),
-- MILKSHAKE & JUICE
('OREO SHAKE'), ('KITKAT SHAKE'), ('KIT KAT SHAKE'), ('CHOCOLATE SHAKE'),
('STRAWBERRY SHAKE'), ('PINEAPPLE SHAKE'), ('ORANGE JUICE'),
('PINEAPPLE JUICE'), ('APPLE JUICE'), ('MIXED FRUIT JUICE'),
('BUTTER SCOTCH SHAKE'), ('LASSI'),
-- MOCKTAIL
('MINT MOJITO'), ('BLUE LAGOON'), ('WATERMELON MOJITO'),
('PULSE MINT MOJITO'), ('SUNNY SETUP'), ('PUNCH MEL'), ('PANCH MEL'),
('FRESH LEMON SODA'), ('VIRGIN MOJITO'), ('BUTTER MILK'),
-- NAAN / ROTI
('NAAN PLAIN'), ('NAAN BUTTER'), ('CHEESE BUTTER NAAN'), ('CHEESE BUTTER NANN'),
('GARLIC NAAN'), ('CHEESE GARLIC NAAN'), ('BUTTER KULCHA'),
('TANDOORI ROTI'), ('TANDOORI BUTTER ROTI'), ('MISSI ROTI'), ('MISSI ROTI (BUTTER)');

-- Delete all items NOT in the valid menu list
DELETE FROM menu_items
WHERE UPPER(TRIM(name)) NOT IN (SELECT item_name FROM valid_menu_items);

-- Drop the temporary table
DROP TABLE valid_menu_items;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Count items per category
SELECT 'Category counts:' as info;
SELECT category, COUNT(*) as item_count 
FROM menu_items 
GROUP BY category 
ORDER BY category;

-- Verify price fixes
SELECT 'Price verification:' as info;
SELECT name, price 
FROM menu_items 
WHERE UPPER(TRIM(name)) LIKE '%VEG CHEESE GRILL SANDWICH%' 
   OR UPPER(TRIM(name)) LIKE '%LACHHA PARATHA%';

-- Check for any remaining DESERT category
SELECT 'Remaining DESERT category items:' as info;
SELECT name, category 
FROM menu_items 
WHERE category = 'DESERT';

-- Total item count
SELECT 'Total menu items:' as info;
SELECT COUNT(*) as total_items FROM menu_items;

COMMIT;

SELECT '✅ Menu update completed successfully! All 4 tasks done:
1. Fixed 2 price discrepancies
2. Added missing menu items
3. Removed extra items
4. Fixed category assignments' as status;
