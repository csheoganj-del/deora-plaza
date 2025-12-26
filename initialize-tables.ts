import { createClient } from '@supabase/supabase-js';

// Supabase configuration - hardcoded values from your .env file
const supabaseUrl = 'https://wjqsqwitgxqypzbaayos.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcXNxd2l0Z3hxeXB6YmFheW9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM1MjM2MywiZXhwIjoyMDgwOTI4MzYzfQ.0jTsgFT39ZVD-kf9qIMb5zmn281LHR7J_803_gYuofY';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function initializeTables() {
  try {
    console.log('Initializing restaurant tables...');
    
    // Insert sample restaurant tables
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
    
    const { data, error } = await supabase
      .from('tables')
      .upsert(sampleTables, {
        onConflict: 'tableNumber, businessUnit'
      })
      .select();

    if (error) {
      console.error('Error initializing restaurant tables:', error.message);
      process.exit(1);
    }

    console.log('Restaurant tables initialized successfully:', data.length, 'tables created');
    console.log('\nNext steps:');
    console.log('1. You can update these tables through the admin dashboard');
    console.log('2. Or modify them directly in the Supabase table editor');
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

initializeTables();