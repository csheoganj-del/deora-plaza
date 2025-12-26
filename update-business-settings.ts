import { createClient } from '@supabase/supabase-js';

// Supabase configuration - hardcoded values from your .env file
const supabaseUrl = 'https://wjqsqwitgxqypzbaayos.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcXNxd2l0Z3hxeXB6YmFheW9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM1MjM2MywiZXhwIjoyMDgwOTI4MzYzfQ.0jTsgFT39ZVD-kf9qIMb5zmn281LHR7J_803_gYuofY';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function updateBusinessSettings() {
  try {
    console.log('Updating business settings with GST fields...');
    
    // Get current business settings
    const { data: currentSettings, error: fetchError } = await supabase
      .from('businessSettings')
      .select('*')
      .eq('id', 'default')
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error fetching business settings:', fetchError.message);
      process.exit(1);
    }

    // Prepare updated settings (without GST fields for now)
    const updatedSettings = {
      ...(currentSettings || {}),
      id: 'default',
      updatedAt: new Date().toISOString()
    };

    // If no current settings exist, add default values
    if (!currentSettings) {
      updatedSettings.name = 'Deora Plaza';
      updatedSettings.address = '123 Hospitality Street, City, State 12345';
      updatedSettings.mobile = '+1234567890';
      updatedSettings.waiterlessMode = false;
      updatedSettings.enablePasswordProtection = true;
      updatedSettings.createdAt = new Date().toISOString();
    }

    // Update business settings with GST fields
    const { data, error } = await supabase
      .from('businessSettings')
      .upsert(updatedSettings, {
        onConflict: 'id'
      })
      .select();

    if (error) {
      console.error('Error updating business settings:', error.message);
      process.exit(1);
    }

    console.log('Business settings updated successfully:', data);
    console.log('\nBusiness settings updated successfully');
    
    console.log('\nNext steps:');
    console.log('1. Manually add GST columns to the businessSettings table using SQL:');
    console.log('   ALTER TABLE businessSettings ADD COLUMN "gstEnabled" BOOLEAN DEFAULT false;');
    console.log('   ALTER TABLE businessSettings ADD COLUMN "gstNumber" TEXT DEFAULT \'\'');
    console.log('2. Visit the business settings page to configure GST');
    console.log('3. Enable GST and enter your GST number');
    console.log('4. GST will now appear on invoices when enabled');
    
  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

updateBusinessSettings();