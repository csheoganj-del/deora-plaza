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
}

export function useServerAuth(): UseServerAuthReturn {
  const [data, setData] = useState<ServerAuthSession | null>(null);
  const [status, setStatus] = useState<AuthStatus>("loading");

  useEffect(() => {
    const checkAuth = async () => {
      try {
        // First try the cookie directly from document.cookie
        const cookies = document.cookie.split(";");
        const authCookie = cookies.find((c) =>
          c.trim().startsWith("bloom-auth-token=")
        );

        if (!authCookie) {
          setStatus("unauthenticated");
          setData(null);
          return;
        }

        // Verify the token via API
        const response = await fetch("/api/auth/me", { credentials: "include" });

        if (response.ok) {
          const result = await response.json();
          if (result.user) {
            setData({ user: result.user });
            setStatus("authenticated");
          } else {
            setData(null);
            setStatus("unauthenticated");
          }
        } else {
          setData(null);
          setStatus("unauthenticated");
        }
      } catch (err) {
        console.error("[useServerAuth] Error checking auth:", err);
        setData(null);
        setStatus("unauthenticated");
      }
    };

    checkAuth();
  }, []);

  return { data, status };
}
