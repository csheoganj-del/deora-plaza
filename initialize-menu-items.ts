import { createClient } from '@supabase/supabase-js';

// Supabase configuration - hardcoded values from your .env file
const supabaseUrl = 'https://wjqsqwitgxqypzbaayos.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcXNxd2l0Z3hxeXB6YmFheW9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM1MjM2MywiZXhwIjoyMDgwOTI4MzYzfQ.0jTsgFT39ZVD-kf9qIMb5zmn281LHR7J_803_gYuofY';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function initializeMenuItems() {
  try {
    console.log('Initializing sample menu items...');
    
    // Insert sample menu items for different business units
    const sampleMenuItems = [
      // Cafe items
      {
        name: 'Cappuccino',
        description: 'Rich espresso with steamed milk foam',
        price: 3.50,
        category: 'Beverages',
        businessUnit: 'cafe',
        isAvailable: true,
        isDrink: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: 'Croissant',
        description: 'Buttery, flaky pastry',
        price: 2.75,
        category: 'Pastries',
        businessUnit: 'cafe',
        isAvailable: true,
        isDrink: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      // Bar items
      {
        name: 'Mojito',
        description: 'Refreshing mint cocktail',
        price: 8.50,
        category: 'Cocktails',
        businessUnit: 'bar',
        isAvailable: true,
        isDrink: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        name: 'Nachos',
        description: 'Tortilla chips with cheese and toppings',
        price: 9.25,
        category: 'Appetizers',
        businessUnit: 'bar',
        isAvailable: true,
        isDrink: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      // Hotel items
      {
        name: 'Room Service Breakfast',
        description: 'Continental breakfast delivered to your room',
        price: 15.00,
        category: 'Room Service',
        businessUnit: 'hotel',
        isAvailable: true,
        isDrink: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      // Garden items
      {
        name: 'Garden Salad',
        description: 'Fresh seasonal vegetables with house dressing',
        price: 7.50,
        category: 'Salads',
        businessUnit: 'garden',
        isAvailable: true,
        isDrink: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    const { data, error } = await supabase
      .from('menu_items')
      .upsert(sampleMenuItems, {
        onConflict: 'name, businessUnit'
      })
      .select();

    if (error) {
      console.error('Error initializing menu items:', error.message);
      process.exit(1);
    }

    console.log('Menu items initialized successfully:', data);
    console.log('\nNext steps:');
    console.log('1. You can update these menu items through the admin dashboard');
    console.log('2. Or modify them directly in the Supabase table editor');
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

initializeMenuItems();