import { createClient } from '@supabase/supabase-js';

// Supabase configuration - hardcoded values from your .env file
const supabaseUrl = 'https://wjqsqwitgxqypzbaayos.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcXNxd2l0Z3hxeXB6YmFheW9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM1MjM2MywiZXhwIjoyMDgwOTI4MzYzfQ.0jTsgFT39ZVD-kf9qIMb5zmn281LHR7J_803_gYuofY';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function initializeCounters() {
  try {
    console.log('Initializing counters...');
    
    // Insert default counters
    const defaultCounters = [
      { id: 'bill-number', value: 1 },
      { id: 'order-number', value: 1 },
      { id: 'customer-id', value: 1 },
      { id: 'hotel-receipts-cafe', value: 1 },
      { id: 'hotel-receipts-bar', value: 1 },
      { id: 'hotel-receipts-hotel', value: 1 },
      { id: 'hotel-receipts-garden', value: 1 }
    ];
    
    const countersWithTimestamps = defaultCounters.map(counter => ({
      ...counter,
      updatedAt: new Date().toISOString()
    }));
    
    const { data, error } = await supabase
      .from('counters')
      .upsert(countersWithTimestamps, {
        onConflict: 'id'
      })
      .select();

    if (error) {
      console.error('Error initializing counters:', error.message);
      process.exit(1);
    }

    console.log('Counters initialized successfully:', data);
    
    // Initialize business settings
    console.log('Initializing business settings...');
    
    const { data: settingsData, error: settingsError } = await supabase
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
      })
      .select();

    if (settingsError) {
      console.error('Error initializing business settings:', settingsError.message);
      process.exit(1);
    }

    console.log('Business settings initialized successfully:', settingsData);
    
    // Initialize sample discount
    console.log('Initializing sample discount...');
    
    const { data: discountData, error: discountError } = await supabase
      .from('discounts')
      .upsert([
        {
          code: 'WELCOME10',
          name: 'Welcome 10% Off',
          type: 'percentage',
          value: 10.00,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ], {
        onConflict: 'code'
      })
      .select();

    if (discountError) {
      console.error('Error initializing sample discount:', discountError.message);
      process.exit(1);
    }

    console.log('Sample discount initialized successfully:', discountData);
    
    console.log('\nAll default data initialized successfully!');
    console.log('\nNext steps:');
    console.log('1. You can update these settings through the admin dashboard');
    console.log('2. Or modify them directly in the Supabase table editor');
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

initializeCounters();