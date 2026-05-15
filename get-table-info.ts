import { createClient } from '@supabase/supabase-js';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

async function getTableInfo() {
  try {
    console.log('Getting bookings table information...');
    
    // Validate environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return;
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Try to get table columns information
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'bookings')
      .eq('table_schema', 'public');
      
    if (error) {
      console.error('Error getting table info:', error);
      return;
    }
    
    console.log('Bookings table columns:');
    data.forEach(column => {
      console.log(`  ${column.column_name}: ${column.data_type}`);
    });
    
  } catch (error) {
    console.error('Error getting table info:', error);
  }
}

getTableInfo();