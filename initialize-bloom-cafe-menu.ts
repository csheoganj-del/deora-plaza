import { createClient } from '@supabase/supabase-js';

// Supabase configuration - hardcoded values from your .env file
const supabaseUrl = 'https://wjqsqwitgxqypzbaayos.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcXNxd2l0Z3hxeXB6YmFheW9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM1MjM2MywiZXhwIjoyMDgwOTI4MzYzfQ.0jTsgFT39ZVD-kf9qIMb5zmn281LHR7J_803_gYuofY';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Complete Bloom Cafe Menu Items
const bloomCafeMenuItems = [
  // COLD BEVERAGES
  {
    name: 'Cold Coffee',
    description: 'Refreshing cold coffee beverage',
    price: 149.00,
    category: 'Cold Beverages',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: true
  },
  {
    name: 'Cold Coffee With Ice Cream',
    description: 'Cold coffee served with vanilla ice cream',
    price: 179.00,
    category: 'Cold Beverages',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: true
  },
  {
    name: 'Cookies Tea',
    description: 'Tea infused with cookie flavors',
    price: 49.00,
    category: 'Cold Beverages',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: true
  },
  {
    name: 'Masala Tea',
    description: 'Traditional Indian spiced tea',
    price: 49.00,
    category: 'Cold Beverages',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: true
  },
  {
    name: 'Black Tea',
    description: 'Classic black tea',
    price: 39.00,
    category: 'Cold Beverages',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: true
  },
  {
    name: 'Hot Coffee',
    description: 'Freshly brewed hot coffee',
    price: 59.00,
    category: 'Cold Beverages',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: true
  },

  // SHAKES
  {
    name: 'Vanilla Shake',
    description: 'Creamy vanilla milkshake',
    price: 149.00,
    category: 'Shakes',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: true
  },
  {
    name: 'Chocolate Shake',
    description: 'Rich chocolate milkshake',
    price: 159.00,
    category: 'Shakes',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: true
  },
  {
    name: 'Kit Kat Shake',
    description: 'Chocolate shake with Kit Kat pieces',
    price: 179.00,
    category: 'Shakes',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: true
  },
  {
    name: 'Oreo Shake',
    description: 'Chocolate shake with Oreo cookies',
    price: 169.00,
    category: 'Shakes',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: true
  },
  {
    name: 'Butter Scotch Shake',
    description: 'Butter scotch flavored milkshake',
    price: 169.00,
    category: 'Shakes',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: true
  },

  // MOCKTAILS
  {
    name: 'Sunny Setup',
    description: 'Refreshing fruit mocktail',
    price: 169.00,
    category: 'Mocktails',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: true
  },
  {
    name: 'Blue Lugan',
    description: 'Blue colored refreshing mocktail',
    price: 149.00,
    category: 'Mocktails',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: true
  },
  {
    name: 'Panch Mel',
    description: 'Mixed fruit mocktail',
    price: 179.00,
    category: 'Mocktails',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: true
  },
  {
    name: 'Fresh Lemon Soda',
    description: 'Refreshing lemon soda',
    price: 99.00,
    category: 'Mocktails',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: true
  },
  {
    name: 'Virgin Mojito',
    description: 'Non-alcoholic mojito',
    price: 139.00,
    category: 'Mocktails',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: true
  },

  // DESSERTS
  {
    name: 'Vanilla Ice Cream',
    description: 'Classic vanilla ice cream',
    price: 49.00,
    category: 'Desserts',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Butter Scotch Ice Cream',
    description: 'Butter scotch flavored ice cream',
    price: 59.00,
    category: 'Desserts',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Chocolate Ice Cream',
    description: 'Rich chocolate ice cream',
    price: 69.00,
    category: 'Desserts',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Rosperel Ice Cream',
    description: 'Special flavor ice cream',
    price: 89.00,
    category: 'Desserts',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },

  // BURGERS
  {
    name: 'Veg Burger',
    description: 'Vegetarian burger',
    price: 59.00,
    category: 'Burgers',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Veg Cheese Burger',
    description: 'Vegetarian burger with cheese',
    price: 89.00,
    category: 'Burgers',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },

  // SANDWICHES
  {
    name: 'Veg Grill Sandwich',
    description: 'Grilled vegetable sandwich',
    price: 129.00,
    category: 'Sandwiches',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Veg Sandwich & French Fry',
    description: 'Vegetable sandwich with french fries',
    price: 79.00,
    category: 'Sandwiches',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Bombay Sandwich',
    description: 'Traditional Bombay style sandwich',
    price: 99.00,
    category: 'Sandwiches',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Chipotle Sandwich',
    description: 'Sandwich with chipotle flavor',
    price: 89.00,
    category: 'Sandwiches',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Bread Butter Cheese Sandwich',
    description: 'Classic bread butter cheese sandwich',
    price: 59.00,
    category: 'Sandwiches',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Paneer Sandwich',
    description: 'Sandwich with paneer filling',
    price: 169.00,
    category: 'Sandwiches',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },

  // SOUPS
  {
    name: 'Hot & Sour Soup',
    description: 'Spicy and tangy soup',
    price: 119.00,
    category: 'Soups',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Manchau Soup',
    description: 'Chinese style soup',
    price: 109.00,
    category: 'Soups',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Tomato Soup',
    description: 'Creamy tomato soup',
    price: 129.00,
    category: 'Soups',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Sweet Corn Soup',
    description: 'Soup made with sweet corn',
    price: 99.00,
    category: 'Soups',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Lemon Coriander Soup',
    description: 'Soup with lemon and coriander',
    price: 130.00,
    category: 'Soups',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Cream Mushroom Soup',
    description: 'Creamy soup with mushrooms',
    price: 149.00,
    category: 'Soups',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },

  // CHINESE
  {
    name: 'Paneer Chilli',
    description: 'Paneer in chilli sauce',
    price: 239.00,
    category: 'Chinese',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Honey Chilli',
    description: 'Chilli dish with honey glaze',
    price: 289.00,
    category: 'Chinese',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Chilli Potato',
    description: 'Potatoes in chilli sauce',
    price: 199.00,
    category: 'Chinese',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Chilli Mushroom',
    description: 'Mushrooms in chilli sauce',
    price: 239.00,
    category: 'Chinese',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Manchurian (Gravy)',
    description: 'Manchurian in gravy',
    price: 199.00,
    category: 'Chinese',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Manchurian (Dry)',
    description: 'Dry manchurian',
    price: 199.00,
    category: 'Chinese',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Noodles',
    description: 'Basic noodles',
    price: 169.00,
    category: 'Chinese',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Hakka Noodles',
    description: 'Hakka style noodles',
    price: 139.00,
    category: 'Chinese',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Schezwan Noodles',
    description: 'Spicy schezwan noodles',
    price: 179.00,
    category: 'Chinese',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },

  // RICE
  {
    name: 'Fried Rice',
    description: 'Classic fried rice',
    price: 179.00,
    category: 'Rice',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Schezwan Rice',
    description: 'Spicy schezwan rice',
    price: 169.00,
    category: 'Rice',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Bloom Special Rice',
    description: 'House special rice dish',
    price: 189.00,
    category: 'Rice',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },

  // TANDOOR
  {
    name: 'Paneer Tikka',
    description: 'Paneer marinated and cooked in tandoor',
    price: 269.00,
    category: 'Tandoor',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Achari Paneer Tikka',
    description: 'Paneer tikka with pickle spices',
    price: 239.00,
    category: 'Tandoor',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Malai Paneer Tikka',
    description: 'Paneer tikka in creamy sauce',
    price: 299.00,
    category: 'Tandoor',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Hara Bhara Kabab',
    description: 'Green veggie kababs',
    price: 199.00,
    category: 'Tandoor',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Corn Kabab',
    description: 'Kababs made with corn',
    price: 219.00,
    category: 'Tandoor',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Tandoori Soya Chap',
    description: 'Soya chap prepared in tandoor',
    price: 199.00,
    category: 'Tandoor',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Aacharya Soya Chap',
    description: 'Soya chap with special spices',
    price: 209.00,
    category: 'Tandoor',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Malai Soya Chap',
    description: 'Soya chap in creamy sauce',
    price: 259.00,
    category: 'Tandoor',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },

  // PIZZA
  {
    name: 'Veg Pizza (Big)',
    description: 'Large vegetarian pizza',
    price: 229.00,
    category: 'Pizza',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Veg Pizza (Small)',
    description: 'Small vegetarian pizza',
    price: 179.00,
    category: 'Pizza',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Margaret Pizza (Big)',
    description: 'Large margherita pizza',
    price: 270.00,
    category: 'Pizza',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Margaret Pizza (Small)',
    description: 'Small margherita pizza',
    price: 179.00,
    category: 'Pizza',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Paneer Tikka Pizza (Big)',
    description: 'Large pizza with paneer tikka topping',
    price: 249.00,
    category: 'Pizza',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Paneer Tikka Pizza (Small)',
    description: 'Small pizza with paneer tikka topping',
    price: 199.00,
    category: 'Pizza',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Farm House Pizza (Big)',
    description: 'Large farm house pizza',
    price: 279.00,
    category: 'Pizza',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Farm House Pizza (Small)',
    description: 'Small farm house pizza',
    price: 209.00,
    category: 'Pizza',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },

  // PASTA
  {
    name: 'Pasto Pasta',
    description: 'Special pasta dish',
    price: 249.00,
    category: 'Pasta',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'White Sauce Pasta',
    description: 'Pasta in white sauce',
    price: 199.00,
    category: 'Pasta',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },
  {
    name: 'Red Sauce Pasta',
    description: 'Pasta in red sauce',
    price: 189.00,
    category: 'Pasta',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: false
  },

  // SMOOTHIES
  {
    name: 'Sun Ban Smoothie',
    description: 'Banana smoothie',
    price: 179.00,
    category: 'Smoothies',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: true
  },
  {
    name: 'Hang Over Smoothie',
    description: 'Special hangover recovery smoothie',
    price: 189.00,
    category: 'Smoothies',
    businessUnit: 'cafe',
    isAvailable: true,
    isDrink: true
  }
];

async function initializeBloomCafeMenu() {
  try {
    console.log('🍽️ Initializing Bloom Cafe menu items...\n');
    
    // Add timestamps to all menu items
    const menuItemsWithTimestamps = bloomCafeMenuItems.map(item => ({
      ...item,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));
    
    console.log(`Adding ${menuItemsWithTimestamps.length} menu items to the database...`);
    
    // Insert menu items into the database
    const { data, error } = await supabase
      .from('menu_items')
      .upsert(menuItemsWithTimestamps, {
        onConflict: 'name, businessUnit'
      })
      .select();

    if (error) {
      console.error('❌ Error initializing menu items:', error.message);
      process.exit(1);
    }

    console.log(`✅ Successfully added ${data?.length || menuItemsWithTimestamps.length} menu items to the database!\n`);
    
    // Group items by category for display
    const itemsByCategory: { [key: string]: any[] } = {};
    menuItemsWithTimestamps.forEach(item => {
      if (!itemsByCategory[item.category]) {
        itemsByCategory[item.category] = [];
      }
      itemsByCategory[item.category].push(item);
    });
    
    console.log('📋 Menu Items Summary:');
    console.log('====================');
    
    Object.keys(itemsByCategory).forEach(category => {
      console.log(`\n${category.toUpperCase()}:`);
      console.log('-'.repeat(category.length + 1));
      itemsByCategory[category].forEach(item => {
        console.log(`  ${item.name} — ₹${item.price}`);
      });
    });
    
    console.log(`\n🎉 Total items: ${menuItemsWithTimestamps.length}`);
    console.log('\nNext steps:');
    console.log('1. The menu items are now available in your cafe business unit');
    console.log('2. You can view and manage them through the admin dashboard');
    console.log('3. They will appear in the ordering system for cafe staff');
    
  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

initializeBloomCafeMenu();