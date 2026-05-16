"use client";

import { useEffect, useState } from 'react';
import { getCurrentCustomUser } from '@/actions/custom-auth';

export interface CustomUser {
  userId: string;
  username: string;
  role: string;
  businessUnit: string;
  email?: string;
  phoneNumber?: string;
}

export interface AuthSession {
  user: CustomUser;
}

const SESSION_CACHE_KEY = 'bloom-auth-session-cache';
const SESSION_CACHE_TTL = 5 * 60 * 1000; // 5 minutes in ms

function getCachedSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    const { session, timestamp } = JSON.parse(raw);
    if (Date.now() - timestamp > SESSION_CACHE_TTL) {
      sessionStorage.removeItem(SESSION_CACHE_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

function setCachedSession(session: AuthSession | null) {
  try {
    if (session) {
      sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify({ session, timestamp: Date.now() }));
    } else {
      sessionStorage.removeItem(SESSION_CACHE_KEY);
    }
  } catch {}
}

export function clearSessionCache() {
  try { sessionStorage.removeItem(SESSION_CACHE_KEY); } catch {}
}

/**
 * Hook for custom JWT-based authentication state management.
 * Always starts with loading=true to match server render, then instantly
 * resolves from sessionStorage cache after hydration — no loading flash on navigation.
 */
export function useServerAuth() {
  // Must start with server-safe defaults to avoid hydration mismatch.
  // The layout no longer blocks on loading, so the useEffect cache
  // resolution is instant and causes no visible flash.
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // If we already resolved synchronously (session loaded from cache in useState init), skip
    if (!loading && session) return;

    // Check sessionStorage cache first for instant resolution
    const cached = getCachedSession();
    if (cached) {
      setSession(cached);
      setLoading(false);
      return;
    }

    // No cache — do the server call once
    const checkAuth = async () => {
      try {
        const user = await getCurrentCustomUser();
        if (user) {
          const authSession: AuthSession = {
            user: {
              userId: user.userId as string,
              username: user.username as string || user.phoneNumber as string || '',
              role: user.role as string,
              businessUnit: user.businessUnit as string,
              email: user.email as string,
              phoneNumber: user.phoneNumber as string,
            }
          };
          setSession(authSession);
          setCachedSession(authSession);
        } else {
          setSession(null);
          setCachedSession(null);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  return {
    data: session,
    status: loading ? 'loading' : (session ? 'authenticated' : 'unauthenticated'),
    loading,
    user: session?.user || null,
    isAuthenticated: !!session
  };
}