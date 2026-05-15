/**
 * 🗄️ Database Integration Hub
 * 
 * Central export point for all database-related functionality
 * including synchronization between Supabase and Firebase
 */

// Core database operations
export * from '../supabase/database';

// Synchronization system
export { getSyncManager, createSyncManager } from './sync-manager';
export { getSyncInitializer, initializeSync } from './sync-initializer';

// React hooks for sync
export * from './sync-hooks';

// Types
export type {
  SyncConfig,
  SyncStatus,
  SyncError,
  SyncRecord
} from './sync-manager';

export type {
  SyncInitializerConfig
} from './sync-initializer';

// Utility functions
export function isDatabaseSyncEnabled(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
}

export function getDatabaseSyncConfig() {
  return {
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    firebaseApiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    syncEnabled: isDatabaseSyncEnabled()
  };
}