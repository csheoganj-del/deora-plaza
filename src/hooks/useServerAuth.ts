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

/**
 * Hook for custom JWT-based authentication state management
 */
export function useServerAuth() {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const user = await getCurrentCustomUser();
        if (user) {
          setSession({
            user: {
              userId: user.userId as string,
              username: user.username as string || user.phoneNumber as string || '',
              role: user.role as string,
              businessUnit: user.businessUnit as string,
              email: user.email as string,
              phoneNumber: user.phoneNumber as string,
            }
          });
        } else {
          setSession(null);
        }
      } catch (error) {
        console.error('Error checking auth:', error);
        setSession(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();

    // DISABLED: This was causing dashboard to reload/refresh every 30 seconds
    // Token-based auth should handle expiration naturally without polling
    // If needed, implement event-based auth checking instead
    /*
    const interval = setInterval(checkAuth, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
    */
  }, []);

  return {
    data: session,
    status: loading ? 'loading' : (session ? 'authenticated' : 'unauthenticated'),
    loading,
    user: session?.user || null,
    isAuthenticated: !!session
  };
}