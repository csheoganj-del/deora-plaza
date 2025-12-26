// Utility to test and validate Supabase API keys
import { createClient } from '@supabase/supabase-js';

export function decodeJWT(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (error) {
    console.error('Failed to decode JWT:', error);
    return null;
  }
}

export function validateAPIKeys() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('=== Supabase API Key Validation ===');
  console.log('URL:', supabaseUrl);
  
  if (anonKey) {
    const anonDecoded = decodeJWT(anonKey);
    console.log('Anon Key Decoded:', {
      role: anonDecoded?.role,
      exp: anonDecoded?.exp,
      expDate: anonDecoded?.exp ? new Date(anonDecoded.exp * 1000).toISOString() : 'N/A',
      isExpired: anonDecoded?.exp ? Date.now() > anonDecoded.exp * 1000 : 'Unknown'
    });
  }
  
  if (serviceKey) {
    const serviceDecoded = decodeJWT(serviceKey);
    console.log('Service Key Decoded:', {
      role: serviceDecoded?.role,
      exp: serviceDecoded?.exp,
      expDate: serviceDecoded?.exp ? new Date(serviceDecoded.exp * 1000).toISOString() : 'N/A',
      isExpired: serviceDecoded?.exp ? Date.now() > serviceDecoded.exp * 1000 : 'Unknown'
    });
  }
}

export async function testAPIKeys() {
  validateAPIKeys();
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !anonKey) {
    console.error('Missing Supabase URL or Anon Key');
    return { success: false, error: 'Missing credentials' };
  }
  
  try {
    console.log('Testing anon key...');
    const anonClient = createClient(supabaseUrl, anonKey);
    const { data, error } = await anonClient.from('businessSettings').select('count').limit(1);
    
    if (error) {
      console.error('Anon key test failed:', error);
      return { success: false, error: error.message };
    }
    
    console.log('Anon key test successful');
    return { success: true, data };
  } catch (error) {
    console.error('API key test error:', error);
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

