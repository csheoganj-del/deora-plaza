import { createClient } from '@supabase/supabase-js';

// Supabase configuration - hardcoded values from your .env file
const supabaseUrl = 'https://wjqsqwitgxqypzbaayos.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcXNxd2l0Z3hxeXB6YmFheW9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM1MjM2MywiZXhwIjoyMDgwOTI4MzYzfQ.0jTsgFT39ZVD-kf9qIMb5zmn281LHR7J_803_gYuofY';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function populateBarMenu() {
  try {
    console.log('Populating bar menu with professional items...');

    // Sample bar menu items organized by category
    const barMenuItems = [
      // Beer
      {
        name: "IPA Craft Beer",
        description: "Premium Indian Pale Ale with citrus notes",
        price: 350,
        category: "Beer",
        businessUnit: "bar",
        isAvailable: true
      },
      {
        name: "German Lager",
        description: "Smooth and crisp German-style lager",
        price: 320,
        category: "Beer",
        businessUnit: "bar",
        isAvailable: true
      },
      {
        name: "Local Stout",
        description: "Rich dark beer with coffee undertones",
        price: 380,
        category: "Beer",
        businessUnit: "bar",
        isAvailable: true
      },

      // Wine
      {
        name: "Cabernet Sauvignon",
        description: "Full-bodied red wine from premium vineyards",
        price: 750,
        category: "Wine",
        businessUnit: "bar",
        isAvailable: true
      },
      {
        name: "Chardonnay",
        description: "Oak-aged white wine with buttery finish",
        price: 700,
        category: "Wine",
        businessUnit: "bar",
        isAvailable: true
      },
      {
        name: "Rosé",
        description: "Dry and refreshing pink wine",
        price: 650,
        category: "Wine",
        businessUnit: "bar",
        isAvailable: true
      },

      // Cocktails
      {
        name: "Classic Mojito",
        description: "White rum, fresh mint, lime, sugar, and soda water",
        price: 450,
        category: "Cocktails",
        businessUnit: "bar",
        isAvailable: true
      },
      {
        name: "Old Fashioned",
        description: "Bourbon, sugar, bitters, and orange peel",
        price: 500,
        category: "Cocktails",
        businessUnit: "bar",
        isAvailable: true
      },
      {
        name: "Espresso Martini",
        description: "Vodka, espresso, coffee liqueur, and sugar syrup",
        price: 480,
        category: "Cocktails",
        businessUnit: "bar",
        isAvailable: true
      },
      {
        name: "Negroni",
        description: "Gin, Campari, and sweet vermouth",
        price: 520,
        category: "Cocktails",
        businessUnit: "bar",
        isAvailable: true
      },

      // Whiskey
      {
        name: "Jack Daniel's",
        description: "Tennessee whiskey with smooth vanilla notes",
        price: 400,
        category: "Whiskey",
        businessUnit: "bar",
        isAvailable: true
      },
      {
        name: "Johnnie Walker Black Label",
        description: "Premium blended Scotch whisky",
        price: 550,
        category: "Whiskey",
        businessUnit: "bar",
        isAvailable: true
      },
      {
        name: "Macallan 12 Year",
        description: "Single malt Scotch aged in sherry oak casks",
        price: 1200,
        category: "Whiskey",
        businessUnit: "bar",
        isAvailable: true
      },

      // Vodka
      {
        name: "Absolut Vodka",
        description: "Premium Swedish vodka, clean and crisp",
        price: 350,
        category: "Vodka",
        businessUnit: "bar",
        isAvailable: true
      },
      {
        name: "Belvedere",
        description: "Luxury Polish vodka made from Dankowskie rye",
        price: 600,
        category: "Vodka",
        businessUnit: "bar",
        isAvailable: true
      },

      // Gin
      {
        name: "Bombay Sapphire",
        description: "Premium gin with exotic botanicals",
        price: 400,
        category: "Gin",
        businessUnit: "bar",
        isAvailable: true
      },
      {
        name: "Hendrick's Gin",
        description: "Unique gin infused with cucumber and rose petals",
        price: 500,
        category: "Gin",
        businessUnit: "bar",
        isAvailable: true
      },

      // Rum
      {
        name: "Bacardi Superior",
        description: "Light and smooth white rum",
        price: 350,
        category: "Rum",
        businessUnit: "bar",
        isAvailable: true
      },
      {
        name: "Captain Morgan Spiced",
        description: "Spiced rum with rich flavor profile",
        price: 380,
        category: "Rum",
        businessUnit: "bar",
        isAvailable: true
      },

      // Tequila
      {
        name: "Patrón Silver",
        description: "Premium blanco tequila with agave-forward taste",
        price: 650,
        category: "Tequila",
        businessUnit: "bar",
        isAvailable: true
      },
      {
        name: "Don Julio Reposado",
        description: "Aged tequila with oak and vanilla notes",
        price: 850,
        category: "Tequila",
        businessUnit: "bar",
        isAvailable: true
      },

      // Non-Alcoholic
      {
        name: "Virgin Mojito",
        description: "Fresh mint, lime, and soda water without alcohol",
        price: 200,
        category: "Non-Alcoholic",
        businessUnit: "bar",
        isAvailable: true
      },
      {
        name: "Sparkling Water",
        description: "Premium imported sparkling water",
        price: 150,
        category: "Non-Alcoholic",
        businessUnit: "bar",
        isAvailable: true
      },
      {
        name: "Fresh Lime Soda",
        description: "Homemade lime soda with fresh mint",
        price: 180,
        category: "Non-Alcoholic",
        businessUnit: "bar",
        isAvailable: true
      }
    ];

    // Try to insert with measurement columns first
    let result = await supabase
      .from('menu_items')
      .upsert(barMenuItems.map(item => ({
        ...item,
        measurement: null,
        measurementUnit: null,
        baseMeasurement: null
      })), {
        onConflict: 'name, businessUnit'
      })
      .select();

    // If that fails due to missing columns, try without measurement columns
    if (result.error && result.error.message.includes('column')) {
      console.log('Measurement columns not found, inserting without them...');
      result = await supabase
        .from('menu_items')
        .upsert(barMenuItems, {
          onConflict: 'name, businessUnit'
        })
        .select();
    }

    if (result.error) {
      console.error('Error populating bar menu:', result.error.message);
      process.exit(1);
    }

    console.log('Bar menu populated successfully:', result.data?.length || 0, 'items created');
    console.log('\nCategories included:');
    const categories = [...new Set(barMenuItems.map(item => item.category))];
    categories.forEach(category => console.log('- ' + category));
    
    console.log('\nNext steps:');
    console.log('1. Visit the bar menu management page to review items');
    console.log('2. Adjust prices or availability as needed');
    console.log('3. Add seasonal specials or daily features');
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

populateBarMenu();