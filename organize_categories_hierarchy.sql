-- 1. Ensure the 3 Main Parent Categories exist
INSERT INTO categories (name, slug, business_unit, sort_order)
VALUES 
('Food', 'food', 'restaurant', 10),
('Drinks', 'drinks', 'bar', 20),
('Specials', 'specials', 'restaurant', 30)
ON CONFLICT (name, parent_id, business_unit) DO NOTHING;
-- Note: unique constraint might vary, but this attempts to ensure they exist.

-- 2. Classify 'Food' Sub-categories
-- We assume the parent 'Food' exists. We get its ID.
DO $$
DECLARE
    food_id UUID;
    drinks_id UUID;
    specials_id UUID;
BEGIN
    SELECT id INTO food_id FROM categories WHERE name = 'Food' LIMIT 1;
    SELECT id INTO drinks_id FROM categories WHERE name = 'Drinks' LIMIT 1;
    SELECT id INTO specials_id FROM categories WHERE name = 'Specials' LIMIT 1;

    -- Update Food items
    UPDATE categories 
    SET parent_id = food_id 
    WHERE name IN (
        'Tandoor', 'Rice', 'Sandwich', 'Burger', 'Desert', 'Pizza', 'Pasta', 
        'Appetizer', 'Main Course', 'Salad', 'Soup', 'Starters', 'Breads', 
        'Indian Breads', 'Chinese', 'Continental', 'Snacks'
    )
    AND id != food_id;

    -- Update Drink items
    UPDATE categories 
    SET parent_id = drinks_id 
    WHERE name IN (
        'Vodka', 'Rum', 'Gin', 'Wine', 'Whiskey', 'Beer', 'Cocktail', 'Mocktail', 
        'Cold Coffee', 'Shake', 'Tea', 'Coffee', 'Beverages', 'Soft Drinks', 
        'Juices', 'Smoothies', 'Bar Menu'
    )
    AND id != drinks_id;
    
    -- Anything else default to Specials? Or leave as is.
    -- Let's put 'Royal Feast' or highly specific things in Specials if known.
    
END $$;
