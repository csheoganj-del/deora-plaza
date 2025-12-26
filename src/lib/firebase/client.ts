/**
 * Firebase Client Configuration
 * Used as backup database when Supabase is unavailable
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getFirestore, Firestore } from 'firebase/firestore';
import { getAuth, Auth } from 'firebase/auth';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;
let auth: Auth | null = null;

// Check if Firebase is configured
export const isFirebaseConfigured = () => {
  const config = getFirebaseConfig();
  return !!(
    config.apiKey &&
    config.projectId &&
    config.appId
  );
};

// Get Firebase configuration
const getFirebaseConfig = () => ({
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
});

// Initialize Firebase lazily
const initializeFirebase = () => {
  if (!isFirebaseConfigured()) {
    console.log('⚠️ Firebase not configured - backup database disabled');
    return false;
  }

  if (app) {
    return true; // Already initialized
  }

  try {
    const firebaseConfig = getFirebaseConfig();
    
    if (!getApps().length) {
      app = initializeApp(firebaseConfig);
    } else {
      app = getApps()[0];
    }
    
    db = getFirestore(app);
    auth = getAuth(app);
    
    console.log('🔥 Firebase initialized as backup database');
    return true;
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    return false;
  }
};

// Getters that initialize Firebase on demand
export const getFirebaseApp = (): FirebaseApp | null => {
  if (!app && !initializeFirebase()) {
    return null;
  }
  return app;
};

export const getFirebaseDb = (): Firestore | null => {
  if (!db && !initializeFirebase()) {
    return null;
  }
  return db;
};

export const getFirebaseAuth = (): Auth | null => {
  if (!auth && !initializeFirebase()) {
    return null;
  }
  return auth;
};

// Legacy exports for backward compatibility
export { getFirebaseApp as app, getFirebaseDb as db, getFirebaseAuth as auth };
export const firestore = getFirebaseDb();
