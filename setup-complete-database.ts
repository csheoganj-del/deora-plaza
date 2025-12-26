import { createClient } from '@supabase/supabase-js';

// Supabase configuration - hardcoded values from your .env file
const supabaseUrl = 'https://wjqsqwitgxqypzbaayos.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcXNxd2l0Z3hxeXB6YmFheW9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM1MjM2MywiZXhwIjoyMDgwOTI4MzYzfQ.0jTsgFT39ZVD-kf9qIMb5zmn281LHR7J_803_gYuofY';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function setupCompleteDatabase() {
  try {
    console.log('Setting up complete database structure...');
    
    // Create users table
    const { error: usersTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          username TEXT UNIQUE NOT NULL,
          email TEXT UNIQUE,
          password TEXT,
          role TEXT NOT NULL DEFAULT 'waiter',
          businessUnit TEXT NOT NULL DEFAULT 'cafe',
          name TEXT,
          phoneNumber TEXT,
          isActive BOOLEAN DEFAULT true,
          createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_users_username ON public.users(username);
        CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
        CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);
        CREATE INDEX IF NOT EXISTS idx_users_business_unit ON public.users(businessUnit);
      `
    });

    if (usersTableError && !usersTableError.message.includes('already exists')) {
      console.error('Error creating users table:', usersTableError.message);
    } else {
      console.log('Users table created successfully');
    }

    // Create orders table
    const { error: ordersTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.orders (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          businessUnit TEXT NOT NULL,
          type TEXT NOT NULL,
          tableId TEXT,
          customerMobile TEXT,
          customerName TEXT,
          items JSONB,
          status TEXT DEFAULT 'pending',
          specialInstructions TEXT,
          createdBy TEXT,
          createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_orders_business_unit ON public.orders(businessUnit);
        CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
        CREATE INDEX IF NOT EXISTS idx_orders_created_at ON public.orders(createdAt);
      `
    });

    if (ordersTableError && !ordersTableError.message.includes('already exists')) {
      console.error('Error creating orders table:', ordersTableError.message);
    } else {
      console.log('Orders table created successfully');
    }

    // Create bills table
    const { error: billsTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.bills (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          orderId UUID,
          businessUnit TEXT NOT NULL,
          customerMobile TEXT,
          customerName TEXT,
          subtotal NUMERIC(10,2),
          discountPercent NUMERIC(5,2),
          discountAmount NUMERIC(10,2),
          gstPercent NUMERIC(5,2),
          gstAmount NUMERIC(10,2),
          grandTotal NUMERIC(10,2),
          paymentMethod TEXT,
          paymentStatus TEXT DEFAULT 'pending',
          source TEXT,
          address TEXT,
          items JSONB,
          createdBy TEXT,
          createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_bills_business_unit ON public.bills(businessUnit);
        CREATE INDEX IF NOT EXISTS idx_bills_payment_status ON public.bills(paymentStatus);
        CREATE INDEX IF NOT EXISTS idx_bills_created_at ON public.bills(createdAt);
      `
    });

    if (billsTableError && !billsTableError.message.includes('already exists')) {
      console.error('Error creating bills table:', billsTableError.message);
    } else {
      console.log('Bills table created successfully');
    }

    // Create menu_items table
    const { error: menuItemsTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.menu_items (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          name TEXT NOT NULL,
          description TEXT,
          price NUMERIC(10,2) NOT NULL,
          category TEXT NOT NULL,
          businessUnit TEXT NOT NULL,
          isAvailable BOOLEAN DEFAULT true,
          isDrink BOOLEAN DEFAULT false,
          createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_menu_items_category ON public.menu_items(category);
        CREATE INDEX IF NOT EXISTS idx_menu_items_business_unit ON public.menu_items(businessUnit);
        CREATE INDEX IF NOT EXISTS idx_menu_items_availability ON public.menu_items(isAvailable);
      `
    });

    if (menuItemsTableError && !menuItemsTableError.message.includes('already exists')) {
      console.error('Error creating menu_items table:', menuItemsTableError.message);
    } else {
      console.log('Menu items table created successfully');
    }

    // Create customers table
    const { error: customersTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.customers (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          mobileNumber TEXT UNIQUE NOT NULL,
          name TEXT NOT NULL,
          email TEXT,
          totalSpent NUMERIC(10,2) DEFAULT 0,
          visitCount INTEGER DEFAULT 0,
          createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_customers_mobile ON public.customers(mobileNumber);
        CREATE INDEX IF NOT EXISTS idx_customers_name ON public.customers(name);
      `
    });

    if (customersTableError && !customersTableError.message.includes('already exists')) {
      console.error('Error creating customers table:', customersTableError.message);
    } else {
      console.log('Customers table created successfully');
    }

    // Create tables table
    const { error: tablesTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.tables (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tableNumber TEXT NOT NULL,
          businessUnit TEXT NOT NULL,
          capacity INTEGER NOT NULL,
          status TEXT DEFAULT 'available',
          currentOrderId UUID,
          customerCount INTEGER DEFAULT 0,
          createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_tables_business_unit ON public.tables(businessUnit);
        CREATE INDEX IF NOT EXISTS idx_tables_status ON public.tables(status);
      `
    });

    if (tablesTableError && !tablesTableError.message.includes('already exists')) {
      console.error('Error creating tables table:', tablesTableError.message);
    } else {
      console.log('Tables table created successfully');
    }

    // Create inventory table
    const { error: inventoryTableError } = await supabase.rpc('exec_sql', {
      sql: `
        CREATE TABLE IF NOT EXISTS public.inventory (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          itemName TEXT NOT NULL,
          businessUnit TEXT NOT NULL,
          quantity NUMERIC(10,2) NOT NULL,
          unit TEXT NOT NULL,
          reorderLevel NUMERIC(10,2) DEFAULT 0,
          costPrice NUMERIC(10,2),
          sellingPrice NUMERIC(10,2),
          supplier TEXT,
          createdAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        CREATE INDEX IF NOT EXISTS idx_inventory_business_unit ON public.inventory(businessUnit);
        CREATE INDEX IF NOT EXISTS idx_inventory_item_name ON public.inventory(itemName);
      `
    });

    if (inventoryTableError && !inventoryTableError.message.includes('already exists')) {
      console.error('Error creating inventory table:', inventoryTableError.message);
    } else {
      console.log('Inventory table created successfully');
    }

    console.log('Complete database setup completed!');
    console.log('\nNext steps:');
    console.log('1. If you have existing user data from Firebase, you can create a script to migrate it');
    console.log('2. For now, you can manually add users through the Supabase dashboard');
    console.log('3. Or run the create-admin-user.ts script to create an admin user');
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

setupCompleteDatabase();