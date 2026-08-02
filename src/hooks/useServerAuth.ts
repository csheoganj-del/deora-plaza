"use client";

import { useEffect, useState } from "react";

interface ServerAuthUser {
  id: string;
  username?: string;
  name?: string;
  role: string;
  businessUnit: string;
}

interface ServerAuthSession {
  user: ServerAuthUser | null;
}

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface UseServerAuthReturn {
  data: ServerAuthSession | null;
  status: AuthStatus;
  loading: boolean;
}

/**
 * Auth status from the server cookie (including HttpOnly).
 * Always verifies via /api/auth/me — never trust document.cookie alone,
 * because the auth cookie may be HttpOnly and invisible to JS.
 */
export function useServerAuth(): UseServerAuthReturn {
  const [data, setData] = useState<ServerAuthSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    let cancelled = false;

    const checkAuth = async () => {
      try {
        // Always hit the API so HttpOnly cookies are included (credentials: "include")
        const response = await fetch("/api/auth/me", {
          credentials: "include",
          cache: "no-store",
        });

        if (cancelled) return;

        if (response.ok) {
          const result = await response.json();
          if (result.user) {
            setData({ user: result.user });
            setStatus("authenticated");
            return;
          }
        }

        setData(null);
        setStatus("unauthenticated");
      } catch (err) {
        if (cancelled) return;
        console.error("[useServerAuth] Error checking auth:", err);
        setData(null);
        setStatus("unauthenticated");
      }
    };

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  return { data, status, loading: status === "loading" };
}
