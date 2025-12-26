import { createClient } from '@supabase/supabase-js';

// Supabase configuration - hardcoded values from your .env file
const supabaseUrl = 'https://wjqsqwitgxqypzbaayos.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcXNxd2l0Z3hxeXB6YmFheW9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM1MjM2MywiZXhwIjoyMDgwOTI4MzYzfQ.0jTsgFT39ZVD-kf9qIMb5zmn281LHR7J_803_gYuofY';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function initializeInventory() {
  try {
    console.log('Initializing sample inventory items...');
    
    // Insert sample inventory items
    const sampleInventory = [
      // Cafe inventory
      {
        itemName: 'Coffee Beans',
        businessUnit: 'cafe',
        quantity: 50.5,
        unit: 'kg',
        reorderLevel: 10,
        costPrice: 12.50,
        sellingPrice: 25.00,
        supplier: 'Premium Coffee Suppliers',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        itemName: 'Milk',
        businessUnit: 'cafe',
        quantity: 100,
        unit: 'liters',
        reorderLevel: 20,
        costPrice: 1.20,
        sellingPrice: 2.50,
        supplier: 'Local Dairy',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      // Bar inventory
      {
        itemName: 'Whiskey',
        businessUnit: 'bar',
        quantity: 25,
        unit: 'bottles',
        reorderLevel: 5,
        costPrice: 25.00,
        sellingPrice: 45.00,
        supplier: 'Premium Spirits Distributors',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        itemName: 'Mixers',
        businessUnit: 'bar',
        quantity: 50,
        unit: 'bottles',
        reorderLevel: 10,
        costPrice: 3.50,
        sellingPrice: 8.00,
        supplier: 'Beverage Suppliers',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      // Garden inventory
      {
        itemName: 'Lettuce',
        businessUnit: 'garden',
        quantity: 15,
        unit: 'kg',
        reorderLevel: 5,
        costPrice: 2.00,
        sellingPrice: 5.00,
        supplier: 'Local Farm',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        itemName: 'Tomatoes',
        businessUnit: 'garden',
        quantity: 20,
        unit: 'kg',
        reorderLevel: 5,
        costPrice: 2.50,
        sellingPrice: 6.00,
        supplier: 'Local Farm',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    const { data, error } = await supabase
      .from('inventory')
      .upsert(sampleInventory, {
        onConflict: 'itemName, businessUnit'
      })
      .select();

    if (error) {
      console.error('Error initializing inventory items:', error.message);
      process.exit(1);
    }

    console.log('Inventory items initialized successfully:', data);
    console.log('\nNext steps:');
    console.log('1. You can update these inventory items through the admin dashboard');
    console.log('2. Or modify them directly in the Supabase table editor');
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

initializeInventory();