import { getSupabase } from './supabase/client';

export async function testSupabaseConnection() {
  try {
    const supabase = getSupabase();
    console.log('Testing Supabase connection...');
    
    // Test basic connection by checking businesssettings table
    const { data, error } = await supabase
      .from('businesssettings')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('Supabase connection test failed:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
        fullError: error
      });
      return { success: false, error };
    }
    
    console.log('Supabase connection successful:', data);
    return { success: true, data };
  } catch (error) {
    console.error('Supabase connection test error:', error);
    return { success: false, error };
  }
}

