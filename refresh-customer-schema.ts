import { createClient } from '@supabase/supabase-js';

// Load environment variables
import dotenv from 'dotenv';
dotenv.config();

async function refreshCustomerSchema() {
  try {
    console.log('Refreshing customer schema cache...');
    
    // Validate environment variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
      console.error('Missing Supabase environment variables');
      return;
    }
    
    // Create Supabase client
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Test query that was failing
    console.log('Testing customer query with lastVisit column...');
    const { data, error } = await supabase
      .from('customers')
      .select('id, name, lastVisit')
      .limit(1);
      
    if (error) {
      console.error('Customer query failed:', error.message);
      return;
    }
    
    console.log('Customer query succeeded!');
    console.log('Found', data?.length || 0, 'customer records');
    
  } catch (error) {
    console.error('Error refreshing customer schema:', error);
  }
}

refreshCustomerSchema();