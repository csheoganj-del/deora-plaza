// Load environment variables first
if (typeof process !== "undefined" && process.env) {
  // Load dotenv synchronously on server side
  try {
    // Check if dotenv is available
    const dotenv = require('dotenv');
    if (dotenv) {
      dotenv.config();
    }
  } catch (e) {
    // dotenv not available, that's okay
  }
}

// Supabase configuration functions (instead of constants) to ensure fresh values
export const SUPABASE_CONFIG = {
  // Client-side configuration
  getUrl: () =>
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_SUPABASE_URL || ""
      : "",
  getAnonKey: () =>
    typeof process !== "undefined"
      ? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
      : "",

  // Server-side configuration
  getServiceUrl: () =>
    typeof process !== "undefined"
      ? process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || ""
      : "",
  getServiceKey: () =>
    typeof process !== "undefined"
      ? process.env.SUPABASE_SERVICE_ROLE_KEY || ""
      : "",

  // Validation
  isClientConfigValid: () => {
    if (typeof process === "undefined") return true; // Client-side browser environment
    return !!(
      process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  },

  isServerConfigValid: () => {
    if (typeof process === "undefined") return true; // Client-side browser environment

    // Ensure SUPABASE_URL is set from NEXT_PUBLIC_SUPABASE_URL if missing
    if (!process.env.SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL) {
      process.env.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    }

    const url =
      process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    return !!(url && key);
  },
};

// Helper function to validate client-side configuration
export function validateClientConfig() {
  if (typeof process === "undefined") return; // Skip in browser environment

  if (!SUPABASE_CONFIG.isClientConfigValid()) {
    console.error("Client-side environment variables check:");
    console.error(
      "NEXT_PUBLIC_SUPABASE_URL:",
      process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Missing",
    );
    console.error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY:",
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "Set" : "Missing",
    );
    throw new Error("Missing Supabase environment variables for client");
  }
}

// Helper function to validate server-side configuration
export function validateServerConfig() {
  if (typeof process === "undefined") return; // Skip in browser environment

  // Ensure SUPABASE_URL is set from NEXT_PUBLIC_SUPABASE_URL if missing
  if (!process.env.SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL) {
    process.env.SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
    console.log("✅ Auto-set SUPABASE_URL from NEXT_PUBLIC_SUPABASE_URL");
  }

  if (!SUPABASE_CONFIG.isServerConfigValid()) {
    console.error("Server-side environment variables check:");
    console.error(
      "SUPABASE_URL:",
      process.env.SUPABASE_URL ? "Set" : "Missing",
    );
    console.error(
      "NEXT_PUBLIC_SUPABASE_URL:",
      process.env.NEXT_PUBLIC_SUPABASE_URL ? "Set" : "Missing",
    );
    console.error(
      "SUPABASE_SERVICE_ROLE_KEY:",
      process.env.SUPABASE_SERVICE_ROLE_KEY ? "Set" : "Missing",
    );
    throw new Error("Missing Supabase environment variables for server");
  }
}

