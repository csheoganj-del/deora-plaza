import { createClient } from '@supabase/supabase-js';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

async function refreshSchemaCache() {
  try {
    console.log('Attempting to refresh Supabase schema cache...');
    
    // Validate environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return;
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Make a series of simple queries to help refresh the schema cache
    console.log('Making test queries to help refresh schema cache...');
    
    // Query 1: Simple select on bookings
    const { data: data1, error: error1 } = await supabase
      .from('bookings')
      .select('id, type, status')
      .limit(1);
      
    if (error1) {
      console.error('Query 1 failed:', error1.message);
    } else {
      console.log('Query 1 succeeded');
    }
    
    // Query 2: Select with filter
    const { data: data2, error: error2 } = await supabase
      .from('bookings')
      .select('id, type')
      .eq('type', 'garden')
      .limit(1);
      
    if (error2) {
      console.error('Query 2 failed:', error2.message);
    } else {
      console.log('Query 2 succeeded');
    }
    
    // Query 3: Select all columns (this might trigger a schema refresh)
    const { data: data3, error: error3 } = await supabase
      .from('bookings')
      .select('*')
      .limit(1);
      
    if (error3) {
      console.error('Query 3 failed:', error3.message);
      console.log('This is likely the PGRST204 error we\'re trying to fix');
    } else {
      console.log('Query 3 succeeded');
    }
    
    console.log('Schema cache refresh attempt completed.');
    console.log('If the PGRST204 error persists, you may need to restart your Supabase project.');
    
  } catch (error) {
    console.error('Error during schema cache refresh:', error);
  }
}

refreshSchemaCache();