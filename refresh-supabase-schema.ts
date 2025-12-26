import { createClient } from '@supabase/supabase-js';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

async function refreshSchema() {
  try {
    console.log('Refreshing Supabase schema...');
    
    // Validate environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      console.error('SUPABASE_URL:', supabaseUrl ? 'Set' : 'Missing');
      console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseKey ? 'Set' : 'Missing');
      return;
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test connection by querying the bookings table
    console.log('Testing connection to bookings table...');
    const { data, error } = await supabase
      .from('bookings')
      .select('id, type')
      .limit(1);
      
    if (error) {
      console.error('Error querying bookings table:', error);
      return;
    }
    
    console.log('Connection successful. Found', data?.length || 0, 'records');
    
    // If we have garden bookings, try to query them specifically
    console.log('Testing garden bookings query...');
    const { data: gardenData, error: gardenError } = await supabase
      .from('bookings')
      .select('*')
      .eq('type', 'garden')
      .limit(5);
      
    if (gardenError) {
      console.error('Error querying garden bookings:', gardenError);
      return;
    }
    
    console.log('Garden bookings query successful. Found', gardenData?.length || 0, 'records');
    
  } catch (error) {
    console.error('Error refreshing schema:', error);
  }
}

refreshSchema();