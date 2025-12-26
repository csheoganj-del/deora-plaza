import { createClient } from '@supabase/supabase-js';

// Supabase configuration - hardcoded values from your .env file
const supabaseUrl = 'https://wjqsqwitgxqypzbaayos.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcXNxd2l0Z3hxeXB6YmFheW9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM1MjM2MywiZXhwIjoyMDgwOTI4MzYzfQ.0jTsgFT39ZVD-kf9qIMb5zmn281LHR7J_803_gYuofY';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function initializeCustomers() {
  try {
    console.log('Initializing sample customers...');
    
    // Insert sample customers
    const sampleCustomers = [
      {
        mobileNumber: '+1234567890',
        name: 'John Doe',
        email: 'john.doe@example.com',
        totalSpent: 150.75,
        visitCount: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        mobileNumber: '+1234567891',
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        totalSpent: 225.50,
        visitCount: 8,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        mobileNumber: '+1234567892',
        name: 'Robert Johnson',
        email: 'robert.johnson@example.com',
        totalSpent: 95.25,
        visitCount: 3,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        mobileNumber: '+1234567893',
        name: 'Emily Davis',
        email: 'emily.davis@example.com',
        totalSpent: 310.00,
        visitCount: 12,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        mobileNumber: '+1234567894',
        name: 'Michael Wilson',
        email: 'michael.wilson@example.com',
        totalSpent: 75.00,
        visitCount: 2,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];
    
    const { data, error } = await supabase
      .from('customers')
      .upsert(sampleCustomers, {
        onConflict: 'mobileNumber'
      })
      .select();

    if (error) {
      console.error('Error initializing customers:', error.message);
      process.exit(1);
    }

    console.log('Customers initialized successfully:', data);
    console.log('\nNext steps:');
    console.log('1. You can update these customers through the admin dashboard');
    console.log('2. Or modify them directly in the Supabase table editor');
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

initializeCustomers();