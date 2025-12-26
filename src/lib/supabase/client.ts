import { createClient } from '@supabase/supabase-js';
import { SUPABASE_CONFIG, validateClientConfig } from './config';

// Create a single Supabase client for the entire client-side application
let supabase: ReturnType<typeof createClient> | null = null;

export function getSupabase(): ReturnType<typeof createClient> {
  if (!supabase) {
    // Validate configuration (will skip validation in browser)
    validateClientConfig();

    // Debug logging
    const url = SUPABASE_CONFIG.getUrl();
    const anonKey = SUPABASE_CONFIG.getAnonKey();
    console.log('- Anon Key Starts With:', anonKey?.substring(0, 10) || 'NONE');
    
    // Validate that we have the required values
    if (!url) {
      console.error('❌ Supabase URL is empty!');
      throw new Error('Supabase URL is required');
    }
    
    if (!anonKey) {
      console.error('❌ Supabase Anon Key is empty!');
      throw new Error('Supabase Anon Key is required');
    }
    
    // More lenient validation for demo purposes
    if (anonKey.length < 20) {
      console.error('❌ Supabase Anon Key appears to be invalid (too short)!');
      throw new Error('Supabase Anon Key appears to be invalid');
    }

    // Check if this is a demo configuration
    const isDemoConfig = url.includes('demo-project') || anonKey.includes('demo');
    
    if (isDemoConfig) {
      console.warn('⚠️ Using demo Supabase configuration - some features may not work');
      console.warn('⚠️ Replace with real Supabase credentials for production use');
    }

    // Create Supabase client with the correct client-side keys
    supabase = createClient(url, anonKey);
    
    console.log('✅ Supabase client created successfully');
  }
  return supabase;
}

// Export a default instance for convenience
let defaultSupabase: ReturnType<typeof createClient> | null = null;
if (typeof window !== 'undefined') {
  defaultSupabase = getSupabase();
}
export default defaultSupabase;

