import { createClient } from '@supabase/supabase-js';

// Supabase configuration - hardcoded values from your .env file
const supabaseUrl = 'https://wjqsqwitgxqypzbaayos.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcXNxd2l0Z3hxeXB6YmFheW9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM1MjM2MywiZXhwIjoyMDgwOTI4MzYzfQ.0jTsgFT39ZVD-kf9qIMb5zmn281LHR7J_803_gYuofY';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

// Predefined users with their roles and business units
const predefinedUsers = [
  // SUPER ADMIN (System Owner)
  {
    username: 'kalpeshdeora',
    email: 'kalpeshdeora@deoraplaza.com',
    password: 'Kalpesh!1006',
    role: 'super_admin',
    businessUnit: 'all',
    name: 'Kalpesh Deora',
    isActive: true
  },
  
  // OWNER (Business Partner)
  {
    username: 'business_owner',
    email: 'owner@deoraplaza.com',
    password: 'OwnerPass123',
    role: 'owner',
    businessUnit: 'all',
    name: 'Business Owner',
    isActive: true
  },
  
  // CAFE & RESTAURANT TEAM
  {
    username: 'cafe_manager',
    email: 'cafe.manager@deoraplaza.com',
    password: 'ManageCafe123',
    role: 'cafe_manager',
    businessUnit: 'cafe',
    name: 'Cafe Manager',
    isActive: true
  },
  {
    username: 'waiter_rahul',
    email: 'rahul.waiter@deoraplaza.com',
    password: 'ServeTables123',
    role: 'waiter',
    businessUnit: 'cafe',
    name: 'Waiter Rahul',
    isActive: true
  },
  {
    username: 'waiter_priya',
    email: 'priya.waiter@deoraplaza.com',
    password: 'ServeTables123',
    role: 'waiter',
    businessUnit: 'cafe',
    name: 'Waiter Priya',
    isActive: true
  },
  {
    username: 'kitchen_chef',
    email: 'chef.kitchen@deoraplaza.com',
    password: 'CookFood123',
    role: 'kitchen',
    businessUnit: 'cafe',
    name: 'Kitchen Chef',
    isActive: true
  },
  
  // BAR TEAM
  {
    username: 'bar_manager',
    email: 'bar.manager@deoraplaza.com',
    password: 'ManageBar123',
    role: 'bar_manager',
    businessUnit: 'bar',
    name: 'Bar Manager',
    isActive: true
  },
  {
    username: 'bartender_sam',
    email: 'sam.bartender@deoraplaza.com',
    password: 'ServeDrinks123',
    role: 'bartender',
    businessUnit: 'bar',
    name: 'Bartender Sam',
    isActive: true
  },
  
  // HOTEL TEAM
  {
    username: 'hotel_manager',
    email: 'hotel.manager@deoraplaza.com',
    password: 'ManageHotel123',
    role: 'hotel_manager',
    businessUnit: 'hotel',
    name: 'Hotel Manager',
    isActive: true
  },
  {
    username: 'hotel_reception',
    email: 'reception.hotel@deoraplaza.com',
    password: 'CheckIn123',
    role: 'hotel_reception',
    businessUnit: 'hotel',
    name: 'Hotel Reception',
    isActive: true
  },
  
  // GARDEN TEAM
  {
    username: 'garden_manager',
    email: 'garden.manager@deoraplaza.com',
    password: 'ManageGarden123',
    role: 'garden_manager',
    businessUnit: 'garden',
    name: 'Garden Manager',
    isActive: true
  }
];

async function initializeAllData() {
  try {
    console.log('🚀 Starting complete data initialization...\n');

    // 1. Initialize counters
    console.log('1. Initializing counters...');
    const defaultCounters = [
      { id: 'orders', lastValue: 1000, prefix: 'ORD', updatedAt: new Date().toISOString() },
      { id: 'bills', lastValue: 2000, prefix: 'BILL', updatedAt: new Date().toISOString() },
      { id: 'customers', lastValue: 500, prefix: 'CUST', updatedAt: new Date().toISOString() }
    ];
    
    const countersWithTimestamps = defaultCounters.map(counter => ({
      ...counter,
      updatedAt: new Date().toISOString()
    }));
    
    const { error: countersError } = await supabase
      .from('counters')
      .upsert(countersWithTimestamps, {
        onConflict: 'id'
      });

    if (countersError) {
      console.error('❌ Error initializing counters:', countersError.message);
      process.exit(1);
    }
    console.log('✅ Counters initialized successfully\n');

    // 2. Initialize business settings
    console.log('2. Initializing business settings...');
    const { error: settingsError } = await supabase
      .from('businessSettings')
      .upsert([
        {
          id: 'default',
          name: 'Deora Plaza',
          address: '123 Hospitality Street, City, State 12345',
          mobile: '+1234567890',
          waiterlessMode: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ], {
        onConflict: 'id'
      });

    if (settingsError) {
      console.error('❌ Error initializing business settings:', settingsError.message);
      process.exit(1);
    }
    console.log('✅ Business settings initialized successfully\n');

    // 3. Initialize sample discount
    console.log('3. Initializing sample discount...');
    const { error: discountError } = await supabase
      .from('discounts')
      .upsert([
        {
          code: 'WELCOME10',
          name: 'Welcome 10% Off',
          type: 'percentage',
          value: 10.00,
          isActive: true,
          validFrom: new Date().toISOString(),
          validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          usageLimit: 100,
          usageCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ], {
        onConflict: 'code'
      });

    if (discountError) {
      console.error('❌ Error initializing discounts:', discountError.message);
      process.exit(1);
    }
    console.log('✅ Sample discount initialized successfully\n');

    // 4. Initialize sample menu items
    console.log('4. Initializing sample menu items...');
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

    try {
      const { error: menuError } = await supabase
        .from('menu_items')
        .upsert(sampleMenuItems, {
          onConflict: 'name, businessUnit'
        });

      if (menuError) {
        console.log('⚠️  Warning: ON CONFLICT constraint not available, trying without conflict resolution...');
        // Try without conflict resolution
        const { error: fallbackError } = await supabase
          .from('menu_items')
          .upsert(sampleMenuItems);
          
        if (fallbackError) {
          throw fallbackError;
        }
      }
      console.log('✅ Menu items initialized successfully\n');
    } catch (error: any) {
      console.error('❌ Error initializing menu items:', error.message);
      process.exit(1);
    }

    // 5. Initialize restaurant tables
    console.log('5. Initializing restaurant tables...');
    const sampleTables = [];

    // Cafe tables (1-20)
    for (let i = 1; i <= 20; i++) {
      sampleTables.push({
        tableNumber: `C${i.toString().padStart(2, '0')}`,
        businessUnit: 'cafe',
        capacity: i <= 10 ? 4 : 6,
        status: 'available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // Bar tables (1-10)
    for (let i = 1; i <= 10; i++) {
      sampleTables.push({
        tableNumber: `B${i.toString().padStart(2, '0')}`,
        businessUnit: 'bar',
        capacity: i <= 5 ? 2 : 4,
        status: 'available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    // Garden tables (1-15)
    for (let i = 1; i <= 15; i++) {
      sampleTables.push({
        tableNumber: `G${i.toString().padStart(2, '0')}`,
        businessUnit: 'garden',
        capacity: i <= 10 ? 4 : 8,
        status: 'available',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    }

    try {
      const { error: tablesError } = await supabase
        .from('tables')
        .upsert(sampleTables, {
          onConflict: 'tableNumber, businessUnit'
        });

      if (tablesError) {
        console.log('⚠️  Warning: ON CONFLICT constraint not available for tables, trying without conflict resolution...');
        // Try without conflict resolution
        const { error: fallbackError } = await supabase
          .from('tables')
          .upsert(sampleTables);
          
        if (fallbackError) {
          throw fallbackError;
        }
      }
      console.log('✅ Restaurant tables initialized successfully\n');
    } catch (error: any) {
      console.error('❌ Error initializing restaurant tables:', error.message);
      process.exit(1);
    }

    // 6. Initialize hotel rooms
    console.log('6. Initializing hotel rooms...');
    const sampleRooms = [
      {
        number: '101',
        type: 'Standard',
        price: 2500,
        capacity: 2,
        status: 'available',
        floor: 1,
        amenities: ['WiFi', 'TV', 'AC'],
        description: 'Cozy standard room with essential amenities'
      },
      {
        number: '102',
        type: 'Standard',
        price: 2500,
        capacity: 2,
        status: 'available',
        floor: 1,
        amenities: ['WiFi', 'TV', 'AC'],
        description: 'Comfortable standard room'
      },
      {
        number: '103',
        type: 'Deluxe',
        price: 3500,
        capacity: 2,
        status: 'available',
        floor: 1,
        amenities: ['WiFi', 'TV', 'AC', 'Mini Bar'],
        description: 'Spacious deluxe room with premium amenities'
      },
      {
        number: '201',
        type: 'Deluxe',
        price: 3500,
        capacity: 2,
        status: 'available',
        floor: 2,
        amenities: ['WiFi', 'TV', 'AC', 'Mini Bar'],
        description: 'Deluxe room with city view'
      },
      {
        number: '202',
        type: 'Suite',
        price: 5000,
        capacity: 4,
        status: 'available',
        floor: 2,
        amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Kitchenette', 'Balcony'],
        description: 'Luxurious suite with kitchenette and balcony'
      },
      {
        number: '301',
        type: 'Suite',
        price: 6000,
        capacity: 4,
        status: 'available',
        floor: 3,
        amenities: ['WiFi', 'TV', 'AC', 'Mini Bar', 'Kitchenette', 'Balcony', 'Jacuzzi'],
        description: 'Premium suite with jacuzzi and panoramic view'
      }
    ];

    // Add timestamps to all rooms
    const roomsWithTimestamps = sampleRooms.map(room => ({
      ...room,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }));

    // Insert sample rooms
    const { error: roomsError } = await supabase
      .from('rooms')
      .upsert(roomsWithTimestamps, {
        onConflict: 'number'
      });

    if (roomsError) {
      console.error('❌ Error initializing rooms:', roomsError.message);
      process.exit(1);
    }
    console.log('✅ Hotel rooms initialized successfully\n');

    console.log('🎉 All data initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('💥 Unexpected error during initialization:', error);
    process.exit(1);
  }
}

initializeAllData();