"use client";

import { useState, useEffect } from "react";
import { getSupabase } from "@/lib/supabase/client";
import { getCurrentUser } from "@/lib/supabase/auth";
import { getUserById } from "@/actions/user";
import { getCurrentCustomUser } from "@/actions/custom-auth";

interface User {
  id: string;
  email?: string | null;
  name?: string | null;
  role?: string | null;
  businessUnit?: string | null;
}

interface Session {
  user?: User | null;
  expires?: string;
}

export function useSupabaseSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [status, setStatus] = useState<"loading" | "authenticated" | "unauthenticated">("loading");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const fetchSession = async () => {
      // Create a timeout promise that forces resolution if network hangs
      const timeoutPromise = new Promise<{ timeout: true }>((resolve) => {
        setTimeout(() => resolve({ timeout: true }), 15000); // 15 seconds
      });

      try {
        // Race the actual checks against the timeout
        const result = await Promise.race([
          (async () => {
            // First, try to get user from custom auth (JWT token)
            console.log("useSupabaseSession: Checking custom auth...");
            const customUser = await getCurrentCustomUser().catch((e) => {
              console.error("useSupabaseSession: Error checking custom user:", e);
              return null;
            });
            console.log("useSupabaseSession: Custom auth result:", customUser ? "Found" : "Not found");
            return { customUser };
          })(),
          timeoutPromise
        ]);

        if ('timeout' in result) {
          console.warn("Session check timed out in race (15s)");
          // Don't return here, let the fallback logic run or set unauthenticated
          if (isMounted) {
            setSession(null);
            setStatus("unauthenticated");
            setError("Session check timed out (15s limit reached)");
          }
          return;
        }

        const { customUser } = result;


        if (!isMounted) return;

        if (customUser) {
          // User is authenticated with custom auth system
          console.log("useSupabaseSession: Authenticated with custom user", customUser.userId);
          setSession({
            user: {
              id: customUser.userId,
              email: customUser.username + "@deoraplaza.com", // Construct email for compatibility
              name: customUser.name || customUser.username,
              role: customUser.role,
              businessUnit: customUser.businessUnit,
            },
            expires: ""
          });
          setStatus("authenticated");
          return;
        }

        // Fallback to Supabase auth if no custom auth
        console.log("useSupabaseSession: Checking Supabase auth fallback...");
        const user = await getCurrentUser();

        if (!isMounted) return;

        if (user) {
          // Get additional user metadata using server action
          const result = await getUserById(user.id);

          if (!isMounted) return;

          if (result.success && result.data) {
            const userData = result.data;

            setSession({
              user: {
                id: user.id,
                email: user.email,
                name: userData.username || user.email || userData.name,
                role: userData.role,
                businessUnit: userData.business_unit || userData.businessUnit,
              },
              expires: "" // Supabase handles session expiration automatically
            });
            setStatus("authenticated");
          } else {
            // Fallback: user exists in auth but not in users table
            console.warn("User authenticated but not found in database:", result.error);

            const username = user.email?.split('@')[0] || 'User';
            const isAdmin = user.email?.includes('admin') || user.email?.includes('owner') || user.email?.includes('super');

            setSession({
              user: {
                id: user.id,
                email: user.email,
                name: username,
                role: isAdmin ? 'super_admin' : 'waiter',
                businessUnit: isAdmin ? 'all' : 'cafe',
              },
              expires: ""
            });
            setStatus("authenticated");
          }
          console.log("useSupabaseSession: No user found");
          setSession(null);
          setStatus("unauthenticated");
          setError("No user found in either Custom Auth or Supabase Auth");
        }
      } catch (error: any) {
        console.error("Error fetching session:", error);
        if (isMounted) {
          setSession(null);
          setStatus("unauthenticated");
          setError(`Session fetch error: ${error?.message || String(error)}`);
        }
      }
    };

    // Add a timeout to prevent infinite loading
    const timeoutId = setTimeout(() => {
      if (isMounted && status === "loading") {
        console.warn("Session fetch timeout - setting unauthenticated (safety fallback)");
        setSession(null);
        setStatus("unauthenticated");
        setError("Global safety timeout reached (15s)");
      }
    }, 15000); // 15 second timeout

    fetchSession();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, []);

  // Fallback: if role is not detected but we know this is an admin user, assign super_admin role
  if (status === "authenticated" && session?.user && !session.user.role) {
    // Check if this is an admin user by email pattern
    if (session.user.email?.includes("admin") ||
      session.user.email?.includes("owner") ||
      session.user.email?.includes("super")) {
      return {
        data: {
          ...session,
          user: {
            ...session.user,
            role: "super_admin",
            businessUnit: "all"
          }
        },
        status,
        error: null // No error
      };
    }
  }

  return { data: session, status, error };
}

