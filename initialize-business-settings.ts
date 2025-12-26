import { createClient } from '@supabase/supabase-js';

// Supabase configuration - hardcoded values from your .env file
const supabaseUrl = 'https://wjqsqwitgxqypzbaayos.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcXNxd2l0Z3hxeXB6YmFheW9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM1MjM2MywiZXhwIjoyMDgwOTI4MzYzfQ.0jTsgFT39ZVD-kf9qIMb5zmn281LHR7J_803_gYuofY';

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function initializeBusinessSettings() {
  try {
    console.log('Initializing business settings...');
    
    // Insert default business settings
    const { data, error } = await supabase
      .from('businessSettings')
      .upsert([
        {
          id: 'default',
          name: 'Deora Plaza',
          address: '123 Hospitality Street, City, State 12345',
          mobile: '+1234567890',
          waiterlessMode: false,
          enablePasswordProtection: true, // Add this field
          gstEnabled: false, // Add this field
          gstPercentage: 0, // Changed from gstNumber to gstPercentage
          enableBarModule: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ], {
        onConflict: 'id'
      })
      .select();

    if (error) {
      console.error('Error initializing business settings:', error.message);
      process.exit(1);
    }

    console.log('Business settings initialized successfully:', data);
    console.log('\nNext steps:');
    console.log('1. You can update these settings through the admin dashboard');
    console.log('2. Or modify them directly in the Supabase table editor');
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

initializeBusinessSettings();