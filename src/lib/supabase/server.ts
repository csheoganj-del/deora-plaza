import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { SUPABASE_CONFIG, validateServerConfig } from "./config";

let _supabaseServer: SupabaseClient | null = null;

// Lazy initialization function for server-side Supabase client
export function getSupabaseServer(): SupabaseClient {
  // This function should only be called on the server side
  if (typeof window !== 'undefined') {
    throw new Error('getSupabaseServer should only be called on the server side');
  }

  if (!_supabaseServer) {
    // Validate configuration (will run validation on server)
    validateServerConfig();

    // Create Supabase client with service role key for server-side operations
    _supabaseServer = createClient(SUPABASE_CONFIG.getServiceUrl(), SUPABASE_CONFIG.getServiceKey(), {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return _supabaseServer;
}

// Export the lazy-loaded client for backward compatibility
export const supabaseServer = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    return getSupabaseServer()[prop as keyof SupabaseClient];
  },
});

