import { createClient } from '@supabase/supabase-js';

// Supabase configuration - hardcoded values from your .env file
const supabaseUrl = 'https://wjqsqwitgxqypzbaayos.supabase.co';
const supabaseServiceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndqcXNxd2l0Z3hxeXB6YmFheW9zIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTM1MjM2MywiZXhwIjoyMDgwOTI4MzYzfQ.0jTsgFT39ZVD-kf9qIMb5zmn281LHR7J_803_gYuofY';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function clearMenuItems() {
  try {
    console.log('🗑️ Clearing all menu items from the database...\n');
    
    // First, let's see how many items we have
    const { count, error: countError } = await supabase
      .from('menu_items')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ Error counting menu items:', countError.message);
      process.exit(1);
    }

    console.log(`Found ${count} menu items in the database.`);

    if (count === 0) {
      console.log('✅ No menu items to delete.\n');
      return;
    }

    // Delete all menu items
    const { error } = await supabase
      .from('menu_items')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all items by using a condition that matches all

    if (error) {
      console.error('❌ Error clearing menu items:', error.message);
      process.exit(1);
    }

    console.log('✅ Successfully cleared all menu items from the database!\n');
    
  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

clearMenuItems();